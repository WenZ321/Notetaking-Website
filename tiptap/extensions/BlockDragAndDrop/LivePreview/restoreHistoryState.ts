import type { Transaction } from "@tiptap/pm/state";
import { HISTORY_KEY } from "./readHistoryState";

/**
 * Puts a saved undo history back with a change. Used when a change only
 * takes away a preview, so undo works as if the preview never happened
 * @param tr The change
 * @param history The history saved before the preview
 */
export function restoreHistoryState(tr: Transaction, history: unknown) {
  if (history !== undefined) tr.setMeta(HISTORY_KEY, { historyState: history });
}
