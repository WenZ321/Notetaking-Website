import type { BlockSideLimits } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type {
  BlockWrappedBlock,
  WrappedBlockColumn,
} from "./getBlockWrappedBlock";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

// How far past a limit the mouse has to go before text is removed, or
// before a gap opens, so neither happens by accident
export const RESIZE_BUFFER = 60;

export type SideResizeLimits = BlockSideLimits & {
  opensGap: boolean; // shrinking leaves a gap that becomes a text column on release
  pushedText: WrappedBlockColumn | null; // the text the block grows into, which stops at the smallest text width
  removeTextAt: number | null; // the width the mouse has to reach to remove the pushed text on release
};

// With no text on the dragged side, the block can't grow that way. It can
// only shrink by leaving a gap at least as wide as the smallest text, and
// only when it's the wrapped block's one block, since other wrapped blocks have no room for
// another column
function limitsForSideWithoutText(
  wrappedBlock: BlockWrappedBlock,
  startWidth: number,
  limits: BlockSideLimits,
): SideResizeLimits {
  const widestWithGap = startWidth - MIN_TEXT_WIDTH;
  if (wrappedBlock.blockCount > 1 || widestWithGap < limits.min) {
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
  text: WrappedBlockColumn,
  startWidth: number,
  limits: BlockSideLimits,
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
 * @param wrapped block What's around the block in its wrapped block
 * @param startWidth The block's width when the resize started
 * @param limits The block's own smallest and largest width
 * @returns The width limits, what text the block pushes, and whether
 * shrinking opens a gap
 */
export function getSideResizeLimits(
  side: "left" | "right",
  wrappedBlock: BlockWrappedBlock | null,
  startWidth: number,
  limits: BlockSideLimits,
): SideResizeLimits {
  const free = {
    ...limits,
    opensGap: false,
    pushedText: null,
    removeTextAt: null,
  };
  if (!wrappedBlock) return free;

  if (side === "left") {
    // nothing before the block can give way, so its left edge is fixed
    if (!wrappedBlock.textBefore) {
      return limitsForSideWithoutText(wrappedBlock, startWidth, limits);
    }
    return limitsForPushedText(wrappedBlock.textBefore, startWidth, limits);
  }

  if (wrappedBlock.textAfter) {
    return limitsForPushedText(wrappedBlock.textAfter, startWidth, limits);
  }

  // text before but none after pins the block to the wrapped block's right end, and a
  // block alone gets text on its right once it shrinks, so both open a gap
  if (wrappedBlock.textBefore || wrappedBlock.blockCount === 1) {
    return limitsForSideWithoutText(wrappedBlock, startWidth, limits);
  }

  // only other blocks in the wrapped block, so the block can take what they leave
  const room = NOTEBOOK_PAGE_WIDTH - wrappedBlock.otherBlocksWidth;
  return { ...free, max: Math.min(limits.max, room) };
}
