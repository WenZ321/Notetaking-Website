import type { Editor } from "@tiptap/core";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { PageNode, TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { isCustomBlock } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { FIT_TOLERANCE } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/FindTextCut";
import {
  isUserEdit,
  wrappedBlockTextFlowPluginKey,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/WrappedBlockTextFlowPlugin";
import { markUndoBehavior } from "@/tiptap/TransactionBehavior";

export const PAGE_FULL_MESSAGE = "This page is full.";

type PlacedNode = { node: TopLevelNode; pos: number };

/**
 * The page's nodes that are drawn, last to first. A dragged block's row is
 * hidden while it's dragged, and it's gone once dropped, so it's left out
 * @param view The editor
 * @returns The drawn nodes, with where each starts
 */
function readDrawnNodesLastFirst(view: EditorView): PlacedNode[] {
  const drawn: PlacedNode[] = [];
  view.state.doc.forEach((node, pos) => {
    const box = node.type.name === "WrappedBlock" ? view.nodeDOM(pos) : null;
    const row = (box as HTMLElement | null)?.firstElementChild;
    const isHiddenRow = row?.getClientRects().length === 0;
    if (!isHiddenRow) drawn.push({ node, pos });
  });
  return drawn.reverse();
}

// Whether a node is an empty line of text
function isEmptyLine({ node }: PlacedNode): boolean {
  return node.type.name === "paragraph" && node.content.size === 0;
}

// The empty last line a row has to have under it, if the page ends with one
function findEmptyLineUnderLastRow(view: EditorView) {
  const [last, above] = readDrawnNodesLastFirst(view);
  if (!last || !above || !isEmptyLine(last)) return null;
  if (above.node.type.name !== "WrappedBlock") return null;
  return view.nodeDOM(last.pos);
}

/**
 * Finds the bottom of what's on the page. A floated row's outer box has no
 * height, so the row inside it is measured too. The empty line a last row
 * needs doesn't count, so the row can reach the page's very bottom
 * @param view The editor
 * @returns How far down the page the lowest bottom edge is
 */
function readContentBottom(view: EditorView): number {
  const boxes = view.dom.querySelectorAll(
    ":scope > *, :scope > .wrapped-row > .wrapped-block",
  );
  const emptyLine = findEmptyLineUnderLastRow(view);
  const countedBoxes = Array.from(boxes).filter((box) => box !== emptyLine);
  const lowestBottom = Math.max(
    ...countedBoxes.map((box) => box.getBoundingClientRect().bottom),
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
 * Finds the empty lines at the end of the page that run past its bottom,
 * so a drop can push them off instead of being refused. The empty line a
 * last row needs stays
 * @param view The editor
 * @returns The change that removes them, or null when there are none
 */
export function removeEmptyLinesPastPage(view: EditorView): Transaction | null {
  const pageBottom = view.dom.getBoundingClientRect().bottom + FIT_TOLERANCE;
  const drawn = readDrawnNodesLastFirst(view);
  const tr = view.state.tr;

  // last to first, so each delete leaves the spots before it in place
  for (let index = 0; index < drawn.length - 1; index++) {
    const line = drawn[index];
    const isUnderRow = drawn[index + 1].node.type.name === "WrappedBlock";
    if (!isEmptyLine(line) || isUnderRow) break;

    const dom = view.nodeDOM(line.pos);
    const isPastBottom =
      dom instanceof HTMLElement &&
      dom.getBoundingClientRect().bottom > pageBottom;
    if (!isPastBottom) break;
    tr.delete(line.pos, line.pos + line.node.nodeSize);
  }
  return tr.docChanged ? tr : null;
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
 * The empty line nearest below the cursor's line. The line right under a
 * row is left out, since the row rules would only add it back
 * @param state The editor
 * @returns The change that takes that line off, or null when there's none
 */
function removeNearestEmptyLineBelow(state: EditorState): Transaction | null {
  const { $to } = state.selection;
  const belowCursor = $to.depth >= 1 ? $to.after(1) : $to.pos;
  let found: PlacedNode | null = null;
  let isUnderRow = false;
  state.doc.forEach((node, pos) => {
    const isFree = !isUnderRow && isEmptyLine({ node, pos });
    if (!found && pos >= belowCursor && isFree) found = { node, pos };
    isUnderRow = node.type.name === "WrappedBlock";
  });
  if (!found) return null;
  const { node, pos } = found as PlacedNode;
  return state.tr.delete(pos, pos + node.nodeSize);
}

/**
 * Closes the gaps of empty lines below the cursor, nearest first, until the
 * page has the room needed. What's below a gap stays where it is
 * @param view The editor
 * @param apply Puts each removal on the page
 * @param neededRoom How much room has to be left under what's on the page
 * @returns Whether there's enough room after
 */
export function closeGapsBelow(
  view: EditorView,
  apply: (tr: Transaction) => void,
  neededRoom = 0,
): boolean {
  while (readRoomLeft(view) + FIT_TOLERANCE < neededRoom) {
    const tr = removeNearestEmptyLineBelow(view.state);
    const sizeBefore = view.state.doc.content.size;
    if (!tr) return false;
    apply(tr);
    // stops if something put the line straight back
    if (view.state.doc.content.size >= sizeBefore) return false;
  }
  return true;
}

/**
 * Puts a change on the page, and takes it back if it's past the bottom.
 * Lines can only be measured once drawn, so the change is drawn first. The
 * old state goes back whole, so a refused edit leaves nothing in undo. A
 * page that's already too long can still have things taken off it. Empty
 * lines below the cursor close up first, undone together with the change
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
  const closeGapsInChange = () =>
    closeGapsBelow(view, (removal) =>
      next(markUndoBehavior(removal, "joinLastStep")),
    );
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
      if (wasPastPage || closeGapsInChange()) return;
      takeBackChange(editor, stateBefore);
    });
    return;
  }

  next(tr);
  const isShorter = tr.doc.content.size < tr.before.content.size;
  if (isShorter || closeGapsInChange()) return;

  view.updateState(stateBefore);
  editor.storage.pageFull.onPageFull(PAGE_FULL_MESSAGE);
}
