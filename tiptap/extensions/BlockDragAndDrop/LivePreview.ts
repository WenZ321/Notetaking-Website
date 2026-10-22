import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { PageChange } from "./PageChange";
import { NodeSelection } from "@tiptap/pm/state";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "./DragState";
import { replaceStretch } from "./PageChange";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// The undo history plugin's name. Undo itself restores the history by
// putting its saved state on a change under this name
export const HISTORY_KEY = "history$";

// Reads the undo history as it is now, so it can be put back later
function readHistoryState(state: EditorState): unknown {
  return state.plugins
    .find(
      (plugin) => (plugin as unknown as { key: string }).key === HISTORY_KEY,
    )
    ?.getState(state);
}

/**
 * Shows a drop on the page while dragging, by making its page change, so
 * the page looks exactly like it will after the drop. Kept out of undo
 * @param view The editor
 * @param change The drop's page change
 */
export function showLiveDropPreview(view: EditorView, change: PageChange) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  if (!drag || drag.preview) return;

  const tr = state.tr;
  replaceStretch(tr, change, change.start, change.end);

  // the hidden original moves along when it comes after the stretch. When
  // the stretch holds it, it's the block the preview shows
  const copyPos = change.start + change.blockOffset;
  const from = change.includesOriginal ? copyPos : tr.mapping.map(drag.from);
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from,
    preview: { copyPos, historyBeforePreview: readHistoryState(state) },
  });
  dispatchChange(view, tr, "skipUndo");
}

/**
 * Takes away the drop shown on the page, putting back the page, the
 * selected block and the undo history from before the drag. Only the
 * nodes the preview changed are drawn again
 * @param view The editor
 */
export function hideLiveDropPreview(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  if (!drag?.preview) return;

  const tr = state.tr.replaceWith(
    0,
    state.doc.content.size,
    drag.startState.doc.content,
  );
  tr.setSelection(NodeSelection.create(tr.doc, drag.startFrom));
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from: drag.startFrom,
    preview: null,
  });
  const history = drag.preview.historyBeforePreview;
  if (history !== undefined) tr.setMeta(HISTORY_KEY, { historyState: history });

  dispatchChange(view, tr, "skipUndo");
}
