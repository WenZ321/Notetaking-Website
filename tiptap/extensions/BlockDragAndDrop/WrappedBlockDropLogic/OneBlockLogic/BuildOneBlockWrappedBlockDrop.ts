import type {
  WrappedBlockDropInfo,
  WrappedBlockDropOutcome,
} from "../BuildWrappedBlockDrop";
import type { WrappedBlockParts } from "../ReadWrappedBlockParts";
import type { TextAroundDrop } from "../ReadTextAroundDrop";
import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "../WrappedBlockFitTypes";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { readTextAroundDrop } from "../ReadTextAroundDrop";
import { buildFitSizes, getSharedHeight } from "../DropSizes";
import { fitOneBlockNoText } from "./FitOneBlockNoText";
import { fitOneBlockOneText } from "./FitOneBlockOneText";
import { fitOneBlockTwoTexts } from "./FitOneBlockTwoTexts";
import { buildDropOutcome } from "../BuildDropOutcome";

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
