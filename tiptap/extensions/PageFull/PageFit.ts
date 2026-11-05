import type { Editor } from "@tiptap/core";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { isCustomBlock } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
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

// How much room is left under what's on the page, less than 0 when it's past the bottom
export function readRoomLeft(view: EditorView): number {
  const pageHeight = view.dom.getBoundingClientRect().height;
  return pageHeight - readContentBottom(view);
}

// Whether what's drawn now passes the page's bottom edge
export function isPastPage(view: EditorView): boolean {
  return readRoomLeft(view) < -FIT_TOLERANCE;
}

/**
 * Puts the page back to how it was, for a change that could only be measured
 * once it was finished, like a resize. The page was already saved with that
 * change, so it's marked as changed to save it again
 * @param editor The editor
 * @param stateBefore The editor before the change
 */
export function takeBackChange(editor: Editor, stateBefore: EditorState) {
  editor.view.updateState(stateBefore);
  editor.emit("update", {
    editor,
    transaction: stateBefore.tr,
    appendedTransactions: [],
  });
  editor.storage.pageFull.onPageFull(PAGE_FULL_MESSAGE);
}

// How many custom blocks are on a page
function countBlocks(doc: PageNode): number {
  let count = 0;
  doc.descendants((node) => {
    if (isCustomBlock(node)) count++;
  });
  return count;
}

/**
 * Puts a change on the page, and takes it back if it's past the bottom.
 * Lines can only be measured once drawn, so the change is drawn first. The
 * old state goes back whole, so a refused edit leaves nothing in undo. A
 * page that's already too long can still have things taken off it
 * @param editor The editor
 * @param tr The change
 * @param next Puts the change on the page
 */
export function keepWithinPage(
  editor: Editor,
  tr: Transaction,
  next: (tr: Transaction) => void,
) {
  const { view } = editor;
  const stateBefore = view.state;
  const isResizing =
    wrappedBlockTextFlowPluginKey.getState(stateBefore)?.isResizing ?? false;

  // shortcut: text being composed, like Japanese input, isn't checked, since
  // taking it back mid-word breaks the input. It can pass the page edge
  if (!isUserEdit(tr, stateBefore, isResizing) || view.composing) {
    next(tr);
    return;
  }

  // a new block has no height until a moment after it's added, so it's
  // measured on the next frame, which is still before anything shows
  if (countBlocks(tr.doc) > countBlocks(tr.before)) {
    const wasPastPage = isPastPage(view);
    next(tr);
    requestAnimationFrame(() => {
      if (!wasPastPage && isPastPage(view)) takeBackChange(editor, stateBefore);
    });
    return;
  }

  next(tr);
  const isShorter = tr.doc.content.size < tr.before.content.size;
  if (isShorter || !isPastPage(view)) return;

  view.updateState(stateBefore);
  editor.storage.pageFull.onPageFull(PAGE_FULL_MESSAGE);
}
