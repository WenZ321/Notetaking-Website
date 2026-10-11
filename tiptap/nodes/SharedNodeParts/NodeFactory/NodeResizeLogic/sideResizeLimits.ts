import type { LengthLimits } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { BlockRow, RowColumn } from "./getBlockRow";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

// How far past a limit the mouse has to go before text is removed, or
// before a gap opens, so neither happens by accident
export const RESIZE_BUFFER = 60;

export type SideResizeLimits = LengthLimits & {
  opensGap: boolean; // shrinking leaves a gap that becomes a text column on release
  pushedText: RowColumn | null; // the text the block grows into, which stops at the smallest text width
  removeTextAt: number | null; // the width the mouse has to reach to remove the pushed text on release
};

// When the dragged edge can't move on its own, the block can't grow that
// way. It can only shrink by leaving a gap at least as wide as the smallest
// text, and only when it's the row's one block, since other rows have no
// room for another column
function limitsForFixedEdge(
  row: BlockRow,
  startWidth: number,
  limits: LengthLimits,
): SideResizeLimits {
  const widestWithGap = startWidth - MIN_TEXT_WIDTH;
  if (row.blockCount > 1 || widestWithGap < limits.min) {
    return {
      min: startWidth,
      max: startWidth,
      opensGap: false,
      pushedText: null,
      removeTextAt: null,
    };
  }
  return {
    min: limits.min,
    max: widestWithGap,
    opensGap: true,
    pushedText: null,
    removeTextAt: null,
  };
}

// The block grows into text until the text is at its smallest width. Past
// that by the buffer, the text is removed, unless the block's own largest
// width stops it first
function limitsForPushedText(
  text: RowColumn,
  startWidth: number,
  limits: LengthLimits,
): SideResizeLimits {
  const textStop = startWidth + Math.max(0, text.width - MIN_TEXT_WIDTH);
  return {
    min: limits.min,
    max: Math.min(limits.max, textStop),
    opensGap: false,
    pushedText: text,
    removeTextAt: textStop <= limits.max ? textStop + RESIZE_BUFFER : null,
  };
}

/**
 * Limits for resizing with the left or right handle so the block's other
 * edge stays where it is
 * @param side The handle being dragged
 * @param row What's around the block in its row
 * @param startWidth The block's width when the resize started
 * @param limits The block's own smallest and largest width
 * @returns The width limits, what text the block pushes, and whether
 * shrinking opens a gap
 */
export function getSideResizeLimits(
  side: "left" | "right",
  row: BlockRow | null,
  startWidth: number,
  limits: LengthLimits,
): SideResizeLimits {
  const free = {
    ...limits,
    opensGap: false,
    pushedText: null,
    removeTextAt: null,
  };
  if (!row) return free;

  if (side === "left") {
    // nothing before the block can give way, so its left edge is fixed
    if (!row.textBefore) return limitsForFixedEdge(row, startWidth, limits);
    return limitsForPushedText(row.textBefore, startWidth, limits);
  }

  // text before the block but none after pins it to the row's right end
  if (row.textBefore && !row.textAfter) {
    return limitsForFixedEdge(row, startWidth, limits);
  }
  if (row.textAfter) {
    return limitsForPushedText(row.textAfter, startWidth, limits);
  }

  // no text in the row, so the block can take what the other blocks leave
  const room = NOTEBOOK_PAGE_WIDTH - row.otherBlocksWidth;
  return { ...free, max: Math.min(limits.max, room) };
}
