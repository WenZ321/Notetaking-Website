import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { ROW_FLOW_META } from "./rowFlowMarker";

/**
 * Applies a change that moves a row's text. It's marked as following the
 * edit that caused it, so one undo takes back both
 * @param view The editor
 * @param tr The change
 */
export function dispatchFlowChange(view: EditorView, tr: Transaction) {
  view.dispatch(
    tr.setMeta(ROW_FLOW_META, true).setMeta("appendedTransaction", tr),
  );
}
