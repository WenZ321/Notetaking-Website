import type {
  WrappedBlockDropInfo,
  WrappedBlockDropOutcome,
} from "./buildOtherWrappedBlockDrop";
import type { WrappedBlockFitSizes } from "./wrappedBlockFitTypes";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookTemplates/PaperLogic/snapBlockSizeToPaper";
import {
  getColumnWidth,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { fitWithoutText } from "./fitWithoutText";
import { fitBesideOneText } from "./fitBesideOneText";
import { fitBetweenTexts } from "./fitBetweenTexts";
import { buildDropOutcome } from "./buildDropOutcome";

/**
 * Builds what a wrapped block with one block turns into when a block is dropped into
 * it. The existing block and kept text keep their size where they can, and the
 * dropped block takes what's left
 * @returns The new wrapped block and the text around it, or null when the dropped
 * block can't get its smallest width there
 */
export function buildOneBlockWrappedBlockDrop({
  wrappedBlock,
  insertIndex,
  draggedBlock,
  draggedBlockMinSize,
  existingBlockMinSizes,
  snapBlockSide,
}: WrappedBlockDropInfo): WrappedBlockDropOutcome | null {
  const columns = wrappedBlock.content.content;
  const side = insertIndex === 0 ? "left" : "right";
  const blockIndex = columns.findIndex((column) => !isTextColumn(column));
  const existingBlock = columns[blockIndex].firstChild!;
  const textBefore = columns.slice(0, blockIndex).find(isTextColumn) ?? null;
  const textAfter = columns.slice(blockIndex + 1).find(isTextColumn) ?? null;

  // with text on both sides, the text on the dropped side leaves
  const hasTwoTexts = !!textBefore && !!textAfter;
  const [droppedSideText, otherSideText] =
    side === "left" ? [textBefore, textAfter] : [textAfter, textBefore];
  const keptText = otherSideText ?? droppedSideText;

  // the existing block keeps its width if it can, and can shrink down to the
  // smallest width its content needs, rounded up to the paper
  const existingBlockCurrentWidth = existingBlock.attrs.width as number;
  const existingBlockContentMin = Math.max(
    MIN_BLOCK_WIDTH,
    existingBlockMinSizes[0].width,
  );
  const existingBlockSnappedMin = snapBlockSide(existingBlockContentMin, {
    min: existingBlockContentMin,
    max: Infinity,
  });
  // a block already narrower than that, like one made before graph paper,
  // isn't made to grow
  const existingBlockMinWidth = Math.min(
    existingBlockCurrentWidth,
    existingBlockSnappedMin,
  );

  // the dropped block works the same way, but it can grow to reach its smallest width
  const draggedBlockCurrentWidth = draggedBlock.attrs.width as number;
  const draggedContentMin = Math.max(
    MIN_BLOCK_WIDTH,
    draggedBlockMinSize.width,
  );
  const draggedBlockMinWidth = snapBlockSide(draggedContentMin, {
    min: draggedContentMin,
    max: Infinity,
  });

  const sizes: WrappedBlockFitSizes = {
    existingBlockCurrentWidth,
    existingBlockMinWidth,
    draggedBlockCurrentWidth,
    draggedBlockMinWidth,
    snapBlockSide,
  };

  const widths = hasTwoTexts
    ? fitBetweenTexts(sizes, getColumnWidth(keptText!))
    : keptText
      ? fitBesideOneText(sizes)
      : fitWithoutText(sizes);
  if (!widths) return null;

  // both blocks share the existing block's height, or taller if the dropped
  // block's content needs more, rounded up to the paper
  const draggedMinHeight = Math.max(
    MIN_BLOCK_HEIGHT,
    draggedBlockMinSize.height,
  );
  const height = Math.max(
    existingBlock.attrs.height as number,
    snapBlockSide(draggedMinHeight, { min: draggedMinHeight, max: Infinity }),
  );

  return buildDropOutcome({
    wrappedBlock,
    side,
    draggedBlock,
    existingBlock,
    textBefore,
    textAfter,
    keptText,
    widths,
    height,
  });
}
