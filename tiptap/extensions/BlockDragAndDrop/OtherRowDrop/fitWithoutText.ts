import type { RowFitSizes, RowWidths } from "./rowFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

/**
 * Fits a row that ends up with just the two blocks. The dropped block takes
 * the rest of the page. If that's under its smallest width, the row's block
 * gives up room, but never past its own smallest width
 * @param sizes The two blocks' widths and smallest widths
 * @returns The widths, or null when the dropped block still doesn't fit
 */
export function fitWithoutText({
  rowBlockWidth,
  rowBlockMin,
  draggedMin,
}: RowFitSizes): RowWidths | null {
  const page = NOTEBOOK_PAGE_WIDTH;
  const rowBlock = Math.max(
    rowBlockMin,
    Math.min(rowBlockWidth, page - draggedMin),
  );
  if (page - rowBlock < draggedMin) return null;

  return { rowBlock, dragged: page - rowBlock, text: null };
}
