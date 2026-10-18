import type {
  WrappedBlockDropInfo,
  WrappedBlockDropOutcome,
} from "./buildOtherWrappedBlockDrop";
import type { WrappedBlockParts } from "./readWrappedBlockParts";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { pickKeptText } from "./pickKeptText";
import { buildFitSizes, getSharedHeight } from "./dropSizes";
import { fitWithoutText } from "./fitWithoutText";
import { fitBesideOneText } from "./fitBesideOneText";
import { fitBetweenTexts } from "./fitBetweenTexts";
import { buildDropOutcome } from "./buildDropOutcome";

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
  const keptText = pickKeptText(side, parts);
  const hasTwoTexts = !!textBefore && !!textAfter;

  const sizes = buildFitSizes({
    existingBlocks,
    existingBlockMinSizes,
    draggedBlock,
    draggedBlockMinSize,
    snapBlockSide,
  });
  const widths = hasTwoTexts
    ? fitBetweenTexts(sizes, getColumnWidth(keptText!))
    : keptText
      ? fitBesideOneText(sizes)
      : fitWithoutText(sizes);
  if (!widths) return null;

  return buildDropOutcome({
    wrappedBlock,
    insertIndex,
    draggedBlock,
    existingBlocks,
    textBefore,
    textAfter,
    keptText,
    widths,
    height: getSharedHeight({
      existingBlocks,
      draggedBlockMinSize,
      snapBlockSide,
    }),
  });
}
