import type { Fragment } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { Slice } from "@tiptap/pm/model";
import { isCustomBlock } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { FIT_TOLERANCE } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/FindTextCut";
import { PAGE_FULL_MESSAGE, readRoomLeft } from "./PageFit";

export const PASTE_CUT_MESSAGE = "Only part of your paste fit on this page.";

/**
 * Every spot a paste can be cut at: after a word, or after something that
 * can't be split, like a block
 * @param content What's being pasted
 * @returns The spots from first to last
 */
export function getPasteCutSpots(content: Fragment): number[] {
  const spots: number[] = [];
  content.descendants((node, pos) => {
    if (node.isText) {
      for (const word of node.text!.matchAll(/\S+/g)) {
        spots.push(pos + word.index + word[0].length);
      }
      return false;
    }
    if (node.isAtom || node.type.name === "WrappedBlock") {
      spots.push(pos + node.nodeSize);
      return false;
    }
    return true;
  });
  return spots;
}

/**
 * The start of a paste, up to a spot. It stays as open as the whole paste
 * was, so a short paste still joins the line the cursor is on
 * @param slice What's being pasted
 * @param spot Where to cut
 * @returns The part before the spot
 */
export function cutPaste(slice: Slice, spot: number): Slice {
  const content = slice.content.cut(0, spot);
  const { openStart, openEnd } = Slice.maxOpen(content);
  return new Slice(
    content,
    Math.min(slice.openStart, openStart),
    Math.min(slice.openEnd, openEnd),
  );
}

/**
 * How tall a paste's blocks are, from their saved sizes. A block's height
 * can't be measured right after it's added, so it's added up instead. Blocks
 * side by side in a row only count once
 * @param content What's being pasted
 * @returns The height they need on the page
 */
export function getPastedBlocksHeight(content: Fragment): number {
  let total = 0;
  content.forEach((item) => {
    let tallest = isCustomBlock(item) ? item.attrs.height : 0;
    item.descendants((node) => {
      if (isCustomBlock(node)) tallest = Math.max(tallest, node.attrs.height);
    });
    total += tallest;
  });
  return total;
}

// Draws the paste for a moment to measure it, then puts the page back. It
// all happens before the browser paints, so nothing shows
function pasteFits(view: EditorView, slice: Slice): boolean {
  const stateBefore = view.state;
  view.updateState(stateBefore.apply(stateBefore.tr.replaceSelection(slice)));
  const roomLeft = readRoomLeft(view);
  view.updateState(stateBefore);
  return roomLeft + FIT_TOLERANCE >= getPastedBlocksHeight(slice.content);
}

/**
 * Pastes as much as fits on the page when the whole paste doesn't
 * @param view The editor
 * @param slice What's being pasted
 * @param onPageFull Tells the user what didn't fit
 * @returns False when the whole paste fits and the normal paste can run
 */
export function pasteWhatFits(
  view: EditorView,
  slice: Slice,
  onPageFull: (message: string) => void,
): boolean {
  if (pasteFits(view, slice)) return false;

  // how many spots fit, found by halving since a longer paste reaches lower
  const spots = getPasteCutSpots(slice.content);
  let low = 0;
  let high = spots.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (pasteFits(view, cutPaste(slice, spots[middle - 1]))) low = middle;
    else high = middle - 1;
  }

  if (low === 0) {
    onPageFull(PAGE_FULL_MESSAGE);
    return true;
  }

  const fitting = cutPaste(slice, spots[low - 1]);
  view.dispatch(
    view.state.tr
      .replaceSelection(fitting)
      .setMeta("paste", true)
      .setMeta("uiEvent", "paste"),
  );
  onPageFull(PASTE_CUT_MESSAGE);
  return true;
}
