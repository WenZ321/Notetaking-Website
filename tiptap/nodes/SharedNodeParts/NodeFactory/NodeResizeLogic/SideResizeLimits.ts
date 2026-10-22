import type { BlockSideLimits } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { WrappedBlockInfo } from "./GetWrappedBlockInfo";
import {
  MIN_TEXT_WIDTH,
  getBlocksRoom,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

/**
 * Limits for resizing with the left or right handle. A left or right
 * wrapped block's blocks can grow until together they leave the text beside
 * them its smallest width. In a newspaper the block grows into the text on
 * the dragged side, until that text is at its smallest width
 * @param side The handle being dragged
 * @param wrappedBlockInfo The block's wrapped block, or null outside one
 * @param startWidth The block's width when the resize started
 * @param limits The block's own smallest and largest width
 * @returns The smallest and largest width
 */
export function getSideResizeLimits(
  side: "left" | "right",
  wrappedBlockInfo: WrappedBlockInfo | null,
  startWidth: number,
  limits: BlockSideLimits,
): BlockSideLimits {
  if (!wrappedBlockInfo) return limits;

  let widest: number;
  if (wrappedBlockInfo.wrap === "newspaper") {
    const text =
      side === "left"
        ? wrappedBlockInfo.textBefore
        : wrappedBlockInfo.textAfter;
    const textToGive = text ? Math.max(0, text.width - MIN_TEXT_WIDTH) : 0;
    widest = startWidth + textToGive;
  } else {
    widest =
      getBlocksRoom(wrappedBlockInfo.wrap) - wrappedBlockInfo.otherBlocksWidth;
  }

  // a block already wider than that, like one made before this rule, isn't
  // made to shrink
  const max = Math.max(
    Math.min(limits.max, widest),
    Math.min(limits.max, startWidth),
  );
  return { min: limits.min, max };
}
