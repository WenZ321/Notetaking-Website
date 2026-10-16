import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
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

// What happens when a block is dropped into another row
export type RowDropOutcome = {
  above: ProseMirrorNode[]; // the stuff (paragraph) that gets pushed out from the left text column, going above the row
  row: ProseMirrorNode; // the new row (wrappedBlock) with the dropped block in it
  draggedColumnIndex: number; // which column in the new row is the dropped block, 0 is leftmost
  below: ProseMirrorNode[]; // the stuff (paragraph) that gets pushed out from the right text column, going below the row
};

// The information about the row we are dropping a block into, and the block being dropped
type RowDropInfo = {
  rowNode: ProseMirrorNode; // the wrapped block being dropped into
  insertIndex: number; // where among the wrapped block the dropped one goes, 0 is before the first
  draggedBlock: ProseMirrorNode;
  draggedBlockMinSize: MinBlockSize;
  rowBlockMinSizes: MinBlockSize[]; // each of the row's blocks, left to right
  snapBlockSide: SnapBlockSide;
};

/**
 * Builds what a row turns into when a block is dropped into it.
 * @returns The new row and the text around it
 */
export function buildOtherRowDrop({
  rowNode,
  insertIndex,
  draggedBlock,
  draggedBlockMinSize,
  rowBlockMinSizes,
  snapBlockSide,
}: RowDropInfo): RowDropOutcome | null {
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
        snapBlockSide,
      ),
    ),
    draggedWidth: draggedBlock.attrs.width as number,
    draggedMin: ceilToPaper(
      Math.max(MIN_BLOCK_WIDTH, draggedBlockMinSize.width),
      snapBlockSide,
    ),
    snapBlockSide,
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
    ceilToPaper(
      Math.max(MIN_BLOCK_HEIGHT, draggedBlockMinSize.height),
      snapBlockSide,
    ),
  );

  return buildRowColumns({
    rowNode,
    side,
    dragged: draggedBlock,
    rowBlock,
    textBefore,
    textAfter,
    keptText,
    widths,
    height,
  });
}
