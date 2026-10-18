import type {
  WrappedBlockDropInfo,
  WrappedBlockDropOutcome,
} from "../buildWrappedBlockDrop";
import type { WrappedBlockParts } from "../readWrappedBlockParts";
import type { TextAroundDrop } from "../readTextAroundDrop";
import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "../wrappedBlockFitTypes";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { readTextAroundDrop } from "../readTextAroundDrop";
import { buildFitSizes, getSharedHeight } from "../dropSizes";
import { fitOneBlockNoText } from "./fitOneBlockNoText";
import { fitOneBlockOneText } from "./fitOneBlockOneText";
import { fitOneBlockTwoTexts } from "./fitOneBlockTwoTexts";
import { buildDropOutcome } from "../buildDropOutcome";

// Fits the widths with the rule for the text around the drop
function fitWidths(
  textAroundDrop: TextAroundDrop,
  sizes: WrappedBlockFitSizes,
): WrappedBlockWidths | null {
  switch (textAroundDrop.kind) {
    case "noText":
      return fitOneBlockNoText(sizes);
    case "oneText":
      return fitOneBlockOneText(sizes);
    case "twoTexts":
      return fitOneBlockTwoTexts(
        sizes,
        getColumnWidth(textAroundDrop.keptText),
      );
  }
}

/**
 * Builds what a wrapped block with one block turns into when a block is dropped into
 * it. The existing block and kept text keep their size where they can, and the
 * dropped block takes what's left
 * @param info The wrapped block and the block being dropped
 * @param parts The wrapped block's one block and its outer text
 * @returns The new wrapped block and the text around it, or null when the dropped
 * block can't get its smallest width there
 */
export function buildOneBlockWrappedBlockDrop(
  {
    wrappedBlock,
    insertIndex,
    draggedBlock,
    draggedBlockMinSize,
    existingBlockMinSizes,
    snapBlockSide,
  }: WrappedBlockDropInfo,
  parts: WrappedBlockParts,
): WrappedBlockDropOutcome | null {
  const { existingBlocks, textBefore, textAfter } = parts;

  // with one block, the drop lands on its left or its right
  const side = insertIndex === 0 ? "left" : "right";
  const textAroundDrop = readTextAroundDrop(side, parts);

  const sizes = buildFitSizes({
    existingBlocks,
    existingBlockMinSizes,
    draggedBlock,
    draggedBlockMinSize,
    snapBlockSide,
  });
  const widths = fitWidths(textAroundDrop, sizes);
  if (!widths) return null;

  return buildDropOutcome({
    wrappedBlock,
    insertIndex,
    draggedBlock,
    existingBlocks,
    textBefore,
    textAfter,
    keptText: textAroundDrop.kind === "noText" ? null : textAroundDrop.keptText,
    widths,
    height: getSharedHeight({
      existingBlocks,
      draggedBlockMinSize,
      snapBlockSide,
    }),
  });
}
