import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { SnapLength } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { MinBlockSize } from "../readContentMinSize";
import type { RowFitSizes } from "./rowFitTypes";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookTemplates/PaperLogic/snapBlockSizeToPaper";
import { ceilToPaper } from "@/components/NotebookTemplates/PaperLogic/ceilToPaper";
import {
  getColumnWidth,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { fitWithoutText } from "./fitWithoutText";
import { fitBesideOneText } from "./fitBesideOneText";
import { fitBetweenTexts } from "./fitBetweenTexts";
import { buildRowColumns } from "./buildRowColumns";

// What a drop into another row turns it into: the new row, plus the text
// that had to leave it, going above or below
export type OtherRowDrop = {
  above: ProseMirrorNode[];
  row: ProseMirrorNode;
  below: ProseMirrorNode[];
};

type OtherRowDropOptions = {
  rowNode: ProseMirrorNode; // the row being dropped into
  insertIndex: number; // where among the row's blocks the dropped one goes, 0 is before the first
  dragged: ProseMirrorNode;
  draggedMinSize: MinBlockSize;
  rowBlockMinSizes: MinBlockSize[]; // each of the row's blocks, left to right
  snapLength: SnapLength;
};

/**
 * Builds what a row turns into when a block is dropped into it. For now
 * only rows with one block have rules: the row's block and kept text keep
 * their size where they can, and the dropped block takes what's left
 * @returns The new row and the text around it, or null when the row has no
 * rules yet or the dropped block can't get its smallest width there
 */
export function buildOtherRowDrop({
  rowNode,
  insertIndex,
  dragged,
  draggedMinSize,
  rowBlockMinSizes,
  snapLength,
}: OtherRowDropOptions): OtherRowDrop | null {
  const columns = rowNode.content.content;
  const blockColumns = columns.filter((column) => !isTextColumn(column));
  if (blockColumns.length !== 1) return null;

  const side = insertIndex === 0 ? "left" : "right";
  const blockIndex = columns.indexOf(blockColumns[0]);
  const rowBlock = blockColumns[0].firstChild!;
  const textBefore = columns.slice(0, blockIndex).find(isTextColumn) ?? null;
  const textAfter = columns.slice(blockIndex + 1).find(isTextColumn) ?? null;

  // with text on both sides, the text on the dropped side leaves
  const hasTwoTexts = !!textBefore && !!textAfter;
  const otherSideText = side === "left" ? textAfter : textBefore;
  const keptText = hasTwoTexts ? otherSideText : (textBefore ?? textAfter);

  const rowBlockWidth = rowBlock.attrs.width as number;
  const sizes: RowFitSizes = {
    rowBlockWidth,
    rowBlockMin: Math.min(
      rowBlockWidth,
      ceilToPaper(
        Math.max(MIN_BLOCK_WIDTH, rowBlockMinSizes[0].width),
        snapLength,
      ),
    ),
    draggedWidth: dragged.attrs.width as number,
    draggedMin: ceilToPaper(
      Math.max(MIN_BLOCK_WIDTH, draggedMinSize.width),
      snapLength,
    ),
    snapLength,
  };

  const widths = hasTwoTexts
    ? fitBetweenTexts(sizes, getColumnWidth(keptText!))
    : keptText
      ? fitBesideOneText(sizes)
      : fitWithoutText(sizes);
  if (!widths) return null;

  // both blocks share the row's block's height, or taller if the dropped
  // block's content needs more
  const height = Math.max(
    rowBlock.attrs.height as number,
    ceilToPaper(Math.max(MIN_BLOCK_HEIGHT, draggedMinSize.height), snapLength),
  );

  return buildRowColumns({
    rowNode,
    side,
    dragged,
    rowBlock,
    textBefore,
    textAfter,
    keptText,
    widths,
    height,
  });
}
