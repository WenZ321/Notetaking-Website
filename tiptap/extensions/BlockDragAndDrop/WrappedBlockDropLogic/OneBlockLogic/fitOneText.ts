import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "../wrappedBlockFitTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { fitNoText } from "./fitNoText";

/**
 * Fits a wrapped block with text on one side of its block. The dropped block keeps
 * its own width, shrinking only if the page is too narrow for it. The text
 * gets what's left, and leaves the wrapped block when that's under the smallest text
 * width, so the dropped block grows to fill it
 * @param sizes The two blocks' widths and smallest widths
 * @returns The widths, or null when the dropped block doesn't fit
 */
export function fitOneText(
  sizes: WrappedBlockFitSizes,
): WrappedBlockWidths | null {
  const withoutText = fitNoText(sizes);
  if (!withoutText) return null;

  const { draggedBlockCurrentWidth, draggedBlockMinWidth, snapBlockSide } =
    sizes;
  const space = NOTEBOOK_PAGE_WIDTH - withoutText.existingBlockWidths[0];
  const draggedBlockWidth = snapBlockSide(draggedBlockCurrentWidth, {
    min: draggedBlockMinWidth,
    max: space,
  });

  const textWidth = space - draggedBlockWidth;
  if (textWidth < MIN_TEXT_WIDTH) return withoutText;

  return { ...withoutText, draggedBlockWidth, textWidth };
}
