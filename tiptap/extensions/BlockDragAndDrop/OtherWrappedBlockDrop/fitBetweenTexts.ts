import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "./wrappedBlockFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { fitWithoutText } from "./fitWithoutText";

/**
 * Fits a wrapped block that had text on both sides of its block. The text that stays
 * keeps its width, and the dropped block takes the width of the text that
 * left, rounded to the paper. When that's too narrow, room comes first from
 * the existing block, down to its smallest width, then from the kept text.
 * Kept text left under the smallest text width leaves the wrapped block too
 * @param sizes The two blocks' widths and smallest widths
 * @param keptTextWidth The width of the text that stays
 * @returns The widths, or null when the dropped block doesn't fit
 */
export function fitBetweenTexts(
  sizes: WrappedBlockFitSizes,
  keptTextWidth: number,
): WrappedBlockWidths | null {
  const {
    existingBlockCurrentWidth,
    existingBlockMinWidth,
    draggedBlockMinWidth,
    snapBlockSide,
  } = sizes;
  const page = NOTEBOOK_PAGE_WIDTH;

  const leftover = page - existingBlockCurrentWidth - keptTextWidth;
  let draggedBlockWidth = snapBlockSide(leftover, { min: 0, max: Infinity });
  let existingBlockWidth = existingBlockCurrentWidth;

  // too narrow for the dropped block, so the existing block gives up whole
  // squares, the shortfall as the min so it rounds up and covers it all
  if (draggedBlockWidth < draggedBlockMinWidth) {
    const shortfall = draggedBlockMinWidth - leftover;
    draggedBlockWidth = draggedBlockMinWidth;
    existingBlockWidth = Math.max(
      existingBlockMinWidth,
      existingBlockCurrentWidth -
        snapBlockSide(shortfall, { min: shortfall, max: Infinity }),
    );
  }

  // the text takes whatever is left, like part of a square from rounding,
  // and the existing block gives up whole squares if that's too narrow
  let textWidth = page - existingBlockWidth - draggedBlockWidth;
  if (textWidth < MIN_TEXT_WIDTH) {
    const shortfall = MIN_TEXT_WIDTH - textWidth;
    existingBlockWidth = Math.max(
      existingBlockMinWidth,
      existingBlockWidth -
        snapBlockSide(shortfall, { min: shortfall, max: Infinity }),
    );
    textWidth = page - existingBlockWidth - draggedBlockWidth;
  }

  if (textWidth < MIN_TEXT_WIDTH) return fitWithoutText(sizes);

  return { existingBlockWidth, draggedBlockWidth, textWidth };
}
