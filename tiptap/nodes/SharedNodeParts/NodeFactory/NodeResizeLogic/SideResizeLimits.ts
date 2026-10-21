import type { BlockSideLimits } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { BlockSurroundings } from "./GetBlockSurroundings";
import {
  MIN_TEXT_WIDTH,
  getBlocksRoom,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";

/**
 * Limits for resizing with the left or right handle. A left or right
 * wrapped block's blocks can grow until together they leave the text beside
 * them its smallest width. In a newspaper the block grows into the text on
 * the dragged side, until that text is at its smallest width
 * @param side The handle being dragged
 * @param surroundings What's around the block, or null outside a wrapped block
 * @param startWidth The block's width when the resize started
 * @param limits The block's own smallest and largest width
 * @returns The smallest and largest width
 */
export function getSideResizeLimits(
  side: "left" | "right",
  surroundings: BlockSurroundings | null,
  startWidth: number,
  limits: BlockSideLimits,
): BlockSideLimits {
  if (!surroundings) return limits;

  let widest: number;
  if (surroundings.wrap === "newspaper") {
    const text =
      side === "left" ? surroundings.textBefore : surroundings.textAfter;
    const textToGive = text ? Math.max(0, text.width - MIN_TEXT_WIDTH) : 0;
    widest = startWidth + textToGive;
  } else {
    widest = getBlocksRoom(surroundings.wrap) - surroundings.otherBlocksWidth;
  }

  // a block already wider than that, like one made before this rule, isn't
  // made to shrink
  const max = Math.max(
    Math.min(limits.max, widest),
    Math.min(limits.max, startWidth),
  );
  return { min: limits.min, max };
}
