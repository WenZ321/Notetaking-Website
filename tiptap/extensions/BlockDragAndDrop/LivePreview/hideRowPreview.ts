import type { EditorView } from "@tiptap/pm/view";
import { ROW_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { restoreHistoryState } from "./restoreHistoryState";

/**
 * Takes away the row drop shown on the page, putting back the row and the
 * undo history from before it, so the page is exactly as it was
 * @param view The editor
 */
export function hideRowPreview(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const { rowDrop, baseDoc, baseFrom, history } = preview;
  const { above, row, below } = rowDrop.result;
  const previewSize = [...above, row, ...below].reduce(
    (sum, node) => sum + node.nodeSize,
    0,
  );
  const originalRow = baseDoc.nodeAt(rowDrop.rowStart)!;

  const tr = state.tr.replaceWith(
    rowDrop.rowStart,
    rowDrop.rowStart + previewSize,
    originalRow,
  );
  tr.setMeta(ROW_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from: baseFrom,
      to: baseFrom + (drag.to - drag.from),
      preview: null,
    });
  restoreHistoryState(tr, history);

  view.dispatch(tr);
}
