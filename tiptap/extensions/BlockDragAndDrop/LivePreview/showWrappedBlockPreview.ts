import type { EditorView } from "@tiptap/pm/view";
import type { WrappedBlockDrop } from "../findDropTarget";
import { WRAPPED_BLOCK_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { getDroppedBlockPos } from "../OtherWrappedBlockDrop/getDroppedBlockPos";
import { readHistoryState } from "./readHistoryState";

/**
 * Shows a wrapped block drop on the page while dragging: the wrapped block is swapped for the
 * saved result, with a copy of the dragged block in it, while the original
 * stays hidden where it was. Kept out of undo, and the page and history
 * from before are saved so the preview can be taken away exactly
 * @param view The editor
 * @param wrappedBlockDrop The wrapped block and the result saved when the target was found
 */
export function showWrappedBlockPreview(
  view: EditorView,
  wrappedBlockDrop: WrappedBlockDrop,
) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const wrappedBlockNode = state.doc.nodeAt(wrappedBlockDrop.wrappedBlockStart);
  if (!drag || drag.preview || !wrappedBlockNode) return;

  const { above, wrappedBlock, below } = wrappedBlockDrop.result;
  const tr = state.tr.replaceWith(
    wrappedBlockDrop.wrappedBlockStart,
    wrappedBlockDrop.wrappedBlockStart + wrappedBlockNode.nodeSize,
    [...above, wrappedBlock, ...below],
  );

  // the original moves along if it comes after the wrapped block
  const from = tr.mapping.map(drag.from);
  tr.setMeta(WRAPPED_BLOCK_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from,
      to: from + (drag.to - drag.from),
      preview: {
        wrappedBlockDrop,
        baseDoc: state.doc,
        baseFrom: drag.from,
        history: readHistoryState(state),
        copyPos: getDroppedBlockPos(
          wrappedBlockDrop.wrappedBlockStart,
          wrappedBlockDrop.result,
        ),
      },
    });

  view.dispatch(tr);
}
