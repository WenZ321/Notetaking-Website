import type { EditorView } from "@tiptap/pm/view";
import type { RowDrop } from "../findDropTarget";
import { ROW_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { getDroppedBlockPos } from "../OtherRowDrop/getDroppedBlockPos";
import { readHistoryState } from "./readHistoryState";

/**
 * Shows a row drop on the page while dragging: the row is swapped for the
 * saved result, with a copy of the dragged block in it, while the original
 * stays hidden where it was. Kept out of undo, and the page and history
 * from before are saved so the preview can be taken away exactly
 * @param view The editor
 * @param rowDrop The row and the result saved when the target was found
 */
export function showRowPreview(view: EditorView, rowDrop: RowDrop) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const rowNode = state.doc.nodeAt(rowDrop.rowStart);
  if (!drag || drag.preview || !rowNode) return;

  const { above, row, below } = rowDrop.result;
  const tr = state.tr.replaceWith(
    rowDrop.rowStart,
    rowDrop.rowStart + rowNode.nodeSize,
    [...above, row, ...below],
  );

  // the original moves along if it comes after the row
  const from = tr.mapping.map(drag.from);
  tr.setMeta(ROW_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from,
      to: from + (drag.to - drag.from),
      preview: {
        rowDrop,
        baseDoc: state.doc,
        baseFrom: drag.from,
        history: readHistoryState(state),
        copyPos: getDroppedBlockPos(rowDrop.rowStart, rowDrop.result),
      },
    });

  view.dispatch(tr);
}
