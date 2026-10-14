import type { RowFitSizes, RowWidths } from "./rowFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { roundToPaper } from "@/components/NotebookTemplates/PaperLogic/roundToPaper";
import { ceilToPaper } from "@/components/NotebookTemplates/PaperLogic/ceilToPaper";
import { fitWithoutText } from "./fitWithoutText";

/**
 * Fits a row that had text on both sides of its block. The text that stays
 * keeps its width, and the dropped block takes the width of the text that
 * left, rounded to the paper. When that's too narrow, room comes first from
 * the row's block, down to its smallest width, then from the kept text.
 * Kept text left under the smallest text width leaves the row too
 * @param sizes The two blocks' widths and smallest widths
 * @param keptTextWidth The width of the text that stays
 * @returns The widths, or null when the dropped block doesn't fit
 */
export function fitBetweenTexts(
  sizes: RowFitSizes,
  keptTextWidth: number,
): RowWidths | null {
  const { rowBlockWidth, rowBlockMin, draggedMin, snapLength } = sizes;
  const page = NOTEBOOK_PAGE_WIDTH;

  const leftover = page - rowBlockWidth - keptTextWidth;
  let dragged = roundToPaper(leftover, snapLength);
  let rowBlock = rowBlockWidth;

  // too narrow for the dropped block, so the row's block gives up whole squares
  if (dragged < draggedMin) {
    dragged = draggedMin;
    rowBlock = Math.max(
      rowBlockMin,
      rowBlockWidth - ceilToPaper(draggedMin - leftover, snapLength),
    );
  }

  // the text takes whatever is left, like part of a square from rounding,
  // and the row's block gives up whole squares if that's too narrow
  let text = page - rowBlock - dragged;
  if (text < MIN_TEXT_WIDTH) {
    rowBlock = Math.max(
      rowBlockMin,
      rowBlock - ceilToPaper(MIN_TEXT_WIDTH - text, snapLength),
    );
    text = page - rowBlock - dragged;
  }

  if (text < MIN_TEXT_WIDTH) return fitWithoutText(sizes);

  return { rowBlock, dragged, text };
}
