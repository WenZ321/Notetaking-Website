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
  existingBlockWidth,
  existingBlockMin,
  draggedMin,
}: WrappedBlockFitSizes): WrappedBlockWidths | null {
  const page = NOTEBOOK_PAGE_WIDTH;
  const existingBlock = Math.max(
    existingBlockMin,
    Math.min(existingBlockWidth, page - draggedMin),
  );
  if (page - existingBlock < draggedMin) return null;

  return { existingBlock, dragged: page - existingBlock, text: null };
}
