import type { RowFitSizes, RowWidths } from "./rowFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { roundToPaper } from "@/components/NotebookTemplates/PaperLogic/roundToPaper";
import { fitWithoutText } from "./fitWithoutText";

/**
 * Fits a row with text on one side of its block. The dropped block keeps
 * its own width, shrinking only if the page is too narrow for it. The text
 * gets what's left, and leaves the row when that's under the smallest text
 * width, so the dropped block grows to fill it
 * @param sizes The two blocks' widths and smallest widths
 * @returns The widths, or null when the dropped block doesn't fit
 */
export function fitBesideOneText(sizes: RowFitSizes): RowWidths | null {
  const withoutText = fitWithoutText(sizes);
  if (!withoutText) return null;

  const { draggedWidth, draggedMin, snapLength } = sizes;
  const space = NOTEBOOK_PAGE_WIDTH - withoutText.rowBlock;
  const dragged = Math.min(
    Math.max(roundToPaper(draggedWidth, snapLength), draggedMin),
    space,
  );

  const text = space - dragged;
  if (text < MIN_TEXT_WIDTH) return withoutText;

  return { ...withoutText, dragged, text };
}
