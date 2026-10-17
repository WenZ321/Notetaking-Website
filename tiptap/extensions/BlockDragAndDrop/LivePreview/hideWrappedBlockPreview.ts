import type { EditorView } from "@tiptap/pm/view";
import { WRAPPED_BLOCK_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { restoreHistoryState } from "./restoreHistoryState";

/**
 * Takes away the wrapped block drop shown on the page, putting back the wrapped block and the
 * undo history from before it, so the page is exactly as it was
 * @param view The editor
 */
export function hideWrappedBlockPreview(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const { wrappedBlockDrop, baseDoc, baseFrom, history } = preview;
  const { above, wrappedBlock, below } = wrappedBlockDrop.result;
  const previewSize = [...above, wrappedBlock, ...below].reduce(
    (sum, node) => sum + node.nodeSize,
    0,
  );
  const originalWrappedBlock = baseDoc.nodeAt(
    wrappedBlockDrop.wrappedBlockStart,
  )!;

  const tr = state.tr.replaceWith(
    wrappedBlockDrop.wrappedBlockStart,
    wrappedBlockDrop.wrappedBlockStart + previewSize,
    originalWrappedBlock,
  );
  tr.setMeta(WRAPPED_BLOCK_PREVIEW_META, true)
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
