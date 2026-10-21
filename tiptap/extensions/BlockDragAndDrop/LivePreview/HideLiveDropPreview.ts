import type { EditorView } from "@tiptap/pm/view";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "../DragState";
import { restoreHistoryState } from "./RestoreHistoryState";
import { sumNodeSizes } from "../SumNodeSizes";

/**
 * Takes away the wrapped block drop shown on the page, putting back the wrapped block and the
 * undo history from before it, so the page is exactly as it was
 * @param view The editor
 */
export function hideLiveDropPreview(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const {
    otherWrappedBlockDrop,
    docBeforePreview,
    fromBeforePreview,
    historyBeforePreview,
  } = preview;
  const {
    above,
    wrappedBlock: newWrappedBlock,
    below,
  } = otherWrappedBlockDrop.outcome;
  const previewSize = sumNodeSizes([...above, newWrappedBlock, ...below]);
  const oldWrappedBlock = docBeforePreview.nodeAt(
    otherWrappedBlockDrop.wrappedBlockStart,
  )!;

  const tr = state.tr.replaceWith(
    otherWrappedBlockDrop.wrappedBlockStart,
    otherWrappedBlockDrop.wrappedBlockStart + previewSize,
    oldWrappedBlock,
  );
  tr.setMeta(LIVE_DROP_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from: fromBeforePreview,
      to: fromBeforePreview + (drag.to - drag.from),
      preview: null,
    });
  restoreHistoryState(tr, historyBeforePreview);

  view.dispatch(tr);
}
