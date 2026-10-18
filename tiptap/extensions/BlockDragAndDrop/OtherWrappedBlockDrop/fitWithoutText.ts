import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "./wrappedBlockFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

/**
 * Fits a wrapped block that ends up with just the two blocks. The dropped block takes
 * the rest of the page. If that's under its smallest width, the existing block
 * gives up room, but never past its own smallest width
 * @param sizes The two blocks' widths and smallest widths
 * @returns The widths, or null when the dropped block still doesn't fit
 */
export function fitWithoutText({
  existingBlockCurrentWidths,
  existingBlockMinWidths,
  draggedBlockMinWidth,
}: WrappedBlockFitSizes): WrappedBlockWidths | null {
  // a one-block rule, so there is just the one existing block
  const [existingBlockCurrentWidth] = existingBlockCurrentWidths;
  const [existingBlockMinWidth] = existingBlockMinWidths;
  const page = NOTEBOOK_PAGE_WIDTH;
  const existingBlockWidth = Math.max(
    existingBlockMinWidth,
    Math.min(existingBlockCurrentWidth, page - draggedBlockMinWidth),
  );
  if (page - existingBlockWidth < draggedBlockMinWidth) return null;

  return {
    existingBlockWidths: [existingBlockWidth],
    draggedBlockWidth: page - existingBlockWidth,
    textWidth: null,
  };
}
