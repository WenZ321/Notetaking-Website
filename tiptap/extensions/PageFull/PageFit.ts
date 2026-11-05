import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { FIT_TOLERANCE } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/FindTextCut";
import {
  isUserEdit,
  wrappedBlockTextFlowPluginKey,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/WrappedBlockTextFlowPlugin";

export const PAGE_FULL_MESSAGE = "This page is full.";

/**
 * Finds the bottom of what's on the page. A floated row's outer box has no
 * height, so the row inside it is measured too. It's counted from the page's
 * top, since an edit can scroll the page inside its box
 * @param view The editor
 * @returns How far down the page the lowest bottom edge is
 */
function readContentBottom(view: EditorView): number {
  const boxes = view.dom.querySelectorAll(
    ":scope > *, :scope > .wrapped-row > .wrapped-block",
  );
  const lowestBottom = Math.max(
    ...Array.from(boxes, (box) => box.getBoundingClientRect().bottom),
  );
  return lowestBottom - view.dom.getBoundingClientRect().top;
}

// Whether what's drawn now passes the page's bottom edge
export function isPastPage(view: EditorView): boolean {
  const pageHeight = view.dom.getBoundingClientRect().height;
  return readContentBottom(view) > pageHeight + FIT_TOLERANCE;
}

/**
 * Puts a change on the page, and takes it back if it's past the bottom.
 * Lines can only be measured once drawn, so the change is drawn first. The
 * old state goes back whole, so a refused edit leaves nothing in undo. A
 * page that's already too long can still have things taken off it
 * @param view The editor
 * @param tr The change
 * @param next Puts the change on the page
 * @param onPageFull Tells the user the change was refused
 */
export function keepWithinPage(
  view: EditorView,
  tr: Transaction,
  next: (tr: Transaction) => void,
  onPageFull: (message: string) => void,
) {
  const stateBefore = view.state;
  const isResizing =
    wrappedBlockTextFlowPluginKey.getState(stateBefore)?.isResizing ?? false;

  // shortcut: text being composed, like Japanese input, isn't checked, since
  // taking it back mid-word breaks the input. It can pass the page edge
  if (!isUserEdit(tr, stateBefore, isResizing) || view.composing) {
    next(tr);
    return;
  }

  next(tr);
  const isShorter = tr.doc.content.size < tr.before.content.size;
  if (isShorter || !isPastPage(view)) return;

  view.updateState(stateBefore);
  onPageFull(PAGE_FULL_MESSAGE);
}
