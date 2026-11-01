import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// How a change shows up in undo:
// ownStep is undone on its own, like a drop or a resize.
// joinLastStep is undone together with the change before it.
// skipUndo is never undone, like a preview.
export type UndoBehavior = "ownStep" | "joinLastStep" | "skipUndo";

// The undo history plugin's name. Undo itself restores the history by
// putting its saved state on a change under this name
export const HISTORY_KEY = "history$";

// Put on the changes that mark a block resize starting or ending
export const BLOCK_RESIZE_META = "blockResize";
export type BlockResizeMeta = "start" | "end";

// Put on the changes the text flow makes, so it doesn't react to its own
export const WRAPPED_BLOCK_FLOW_META = "wrappedBlockTextFlow";

/**
 * Tags a change with how it shows up in undo
 * @param tr The change
 * @param undo How it shows up in undo
 * @returns The same change, tagged
 */
export function markUndoBehavior(
  tr: Transaction,
  undo: UndoBehavior,
): Transaction {
  // undo history joins any change marked as following another one. Only
  // whether the mark is there matters, so the change marks itself
  if (undo === "joinLastStep") tr.setMeta("appendedTransaction", tr);
  if (undo === "skipUndo") tr.setMeta("addToHistory", false);
  return tr;
}

/**
 * Tags a change with how it shows up in undo and puts it on the page
 * @param view The editor
 * @param tr The change
 * @param undo How it shows up in undo
 */
export function dispatchChange(
  view: EditorView,
  tr: Transaction,
  undo: UndoBehavior,
) {
  view.dispatch(markUndoBehavior(tr, undo));
}
