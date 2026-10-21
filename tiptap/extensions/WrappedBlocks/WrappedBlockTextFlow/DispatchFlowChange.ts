import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// Put on the changes this extension makes, so it doesn't react to its own
export const WRAPPED_BLOCK_FLOW_META = "wrappedBlockTextFlow";

/**
 * Applies a change that moves a wrapped block's text. It's marked as following the
 * edit that caused it, so one undo takes back both
 * @param view The editor
 * @param tr The change
 */
export function dispatchFlowChange(view: EditorView, tr: Transaction) {
  view.dispatch(
    tr
      .setMeta(WRAPPED_BLOCK_FLOW_META, true)
      .setMeta("appendedTransaction", tr),
  );
}
