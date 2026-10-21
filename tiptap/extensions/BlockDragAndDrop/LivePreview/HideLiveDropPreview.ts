import type { EditorView } from "@tiptap/pm/view";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "../DragState";
import { restoreHistoryState } from "./RestoreHistoryState";
import { sumNodeSizes } from "../SumNodeSizes";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

/**
 * Takes away the drop shown on the page, putting back what it replaced and the
 * undo history from before it, so the page is exactly as it was
 * @param view The editor
 */
export function hideLiveDropPreview(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const {
    start,
    replacedSize,
    shownNodes,
    docBeforePreview,
    fromBeforePreview,
    historyBeforePreview,
  } = preview;
  const replaced = docBeforePreview.slice(start, start + replacedSize).content;

  const tr = state.tr.replaceWith(
    start,
    start + sumNodeSizes(shownNodes),
    replaced,
  );
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from: fromBeforePreview,
    to: fromBeforePreview + (drag.to - drag.from),
    preview: null,
  });
  restoreHistoryState(tr, historyBeforePreview);

  dispatchChange(view, tr, "skipUndo");
}
