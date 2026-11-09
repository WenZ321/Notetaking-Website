import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { DragOrigin } from "./DragState";
import type { PageChange } from "./PageChange";
import { Selection } from "@tiptap/pm/state";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "./DragState";
import { replaceStretch } from "./PageChange";
import { HISTORY_KEY, dispatchChange } from "@/tiptap/TransactionBehavior";

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
  const { origin } = drag;
  const movedOrigin: DragOrigin =
    origin.kind === "page"
      ? {
          ...origin,
          from: change.includesOriginal ? copyPos : tr.mapping.map(origin.from),
        }
      : origin;
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    origin: movedOrigin,
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
  // the page is the same as before the drag, so its selection fits as it was
  tr.setSelection(
    Selection.fromJSON(tr.doc, drag.startState.selection.toJSON()),
  );
  const { origin } = drag;
  const homeOrigin: DragOrigin =
    origin.kind === "page" ? { ...origin, from: origin.startFrom } : origin;
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    origin: homeOrigin,
    preview: null,
  });
  const history = drag.preview.historyBeforePreview;
  if (history !== undefined) tr.setMeta(HISTORY_KEY, { historyState: history });

  dispatchChange(view, tr, "skipUndo");
}
