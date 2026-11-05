import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type {
  CustomBlockNode,
  TextLineNode,
  TopLevelNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { MinBlockSize } from "./WrappedBlockUtils";
import { Fragment } from "@tiptap/pm/model";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import {
  MAX_BLOCKS,
  getBlocksRoom,
  getTextMovedOut,
  readWrappedBlockParts,
} from "./WrappedBlockUtils";

type AddBlockToRowInfo = {
  wrappedBlock: WrappedBlockNode; // the row the block is added to
  wrap: "left" | "right"; // the side the row wraps to afterward
  insertIndex: number; // which gap between the row's blocks the new one goes in, 0 [block] 1 [block] 2
  newBlock: CustomBlockNode;
  newBlockMinSize: MinBlockSize;
  existingBlockMinSizes: MinBlockSize[]; // one per block already in the row, left to right
  snapBlockSide: SnapBlockSide;
};

// The row with the new block in it, and what moves out of it
export type RowWithNewBlock = {
  above: TextLineNode[]; // a newspaper's left text, moved above the row
  wrappedBlock: WrappedBlockNode;
  below: TopLevelNode[]; // a block pushed out to its own row, then a newspaper's right text
  newColumnIndex: number; // which column holds the new block, 0 is leftmost
};

/**
 * Adds a block to a row, the same way for an insert and a drop. The row
 * wraps to the given side and holds only blocks, so a newspaper's left text
 * moves above it and its right text below. The blocks already there keep
 * their widths when there's room, and give up room right to left, but never
 * past what their content needs. A full row fills the page, with the new
 * block taking what's left. Every block takes the row's shared height
 * @returns The new row, or null when the new block can't get its smallest
 * width there
 */
export function addBlockToRow({
  wrappedBlock,
  wrap,
  insertIndex,
  newBlock,
  newBlockMinSize,
  existingBlockMinSizes,
  snapBlockSide,
}: AddBlockToRowInfo): RowWithNewBlock | null {
  const { existingBlocks, textBefore, textAfter } =
    readWrappedBlockParts(wrappedBlock);

  // how wide the blocks can be together, and which block is pushed out
  let room: number;
  let keptBlocks = existingBlocks;
  let keptMinSizes = existingBlockMinSizes;
  let keptInsertIndex = insertIndex;
  let pushedOutBlock: CustomBlockNode | null = null;
  switch (existingBlocks.length) {
    // one block keeps room for text beside the row
    case 1:
      room = getBlocksRoom(wrap);
      break;

    // two blocks become a full row of three across the page, pushing its text below
    case 2:
      room = NOTEBOOK_PAGE_WIDTH;
      break;

    // three blocks is a full row, so its rightmost block is pushed out to a
    // new row below it, and the new block takes a spot among the other two
    case MAX_BLOCKS:
      room = NOTEBOOK_PAGE_WIDTH;
      pushedOutBlock = existingBlocks[MAX_BLOCKS - 1];
      keptBlocks = existingBlocks.slice(0, -1);
      keptMinSizes = existingBlockMinSizes.slice(0, -1);
      keptInsertIndex = Math.min(insertIndex, keptBlocks.length);
      break;

    default:
      return null;
  }

  // a smallest width rounds up to the paper, never below what the content needs
  const snapMinSide = (contentMin: number, blockMin: number) => {
    const min = Math.max(blockMin, contentMin);
    return snapBlockSide(min, { min, max: Infinity });
  };

  // a block already narrower than its smallest width isn't made to grow
  const widths = keptBlocks.map((block) => block.attrs.width as number);
  const minWidths = keptMinSizes.map((minSize, index) =>
    Math.min(widths[index], snapMinSide(minSize.width, MIN_BLOCK_WIDTH)),
  );
  const newBlockMinWidth = snapMinSide(newBlockMinSize.width, MIN_BLOCK_WIDTH);

  // the blocks already there give up room, right to left, until the new
  // block fits at its smallest width
  let freeWidth = room - widths.reduce((sum, width) => sum + width, 0);
  for (let i = widths.length - 1; i >= 0; i--) {
    if (freeWidth >= newBlockMinWidth) break;

    // the wanted width is the most it can keep, so snapping rounds it down
    // and never gives back the room the new block needs
    const wantedWidth = widths[i] - (newBlockMinWidth - freeWidth);
    const shrunkWidth = snapBlockSide(wantedWidth, {
      min: minWidths[i],
      max: Math.max(minWidths[i], wantedWidth),
    });
    freeWidth += widths[i] - shrunkWidth;
    widths[i] = shrunkWidth;
  }
  if (freeWidth < newBlockMinWidth) return null;

  // a full row leaves no room for text beside it, so the new block takes
  // all the width the others leave
  const isFullRow = keptBlocks.length + 1 === MAX_BLOCKS;
  const newBlockWidth = isFullRow
    ? freeWidth
    : snapBlockSide(newBlock.attrs.width as number, {
        min: newBlockMinWidth,
        max: freeWidth,
      });

  // the tallest block, or taller when the new block's content needs it
  const height = Math.max(
    ...keptBlocks.map((block) => block.attrs.height as number),
    snapMinSide(newBlockMinSize.height, MIN_BLOCK_HEIGHT),
  );

  const columnType = wrappedBlock.child(0).type;
  const toBlockColumn = (block: CustomBlockNode, width: number) =>
    columnType.create(
      { columnType: "block" },
      block.type.create(
        { ...block.attrs, width, height },
        block.content,
        block.marks,
      ),
    );
  const newColumn = toBlockColumn(newBlock, newBlockWidth);
  const keptColumns = keptBlocks.map((block, index) =>
    toBlockColumn(block, widths[index]),
  );
  const columns = [
    ...keptColumns.slice(0, keptInsertIndex),
    newColumn,
    ...keptColumns.slice(keptInsertIndex),
  ];

  // the pushed out block keeps its size in its own row. Every row is
  // followed by a line of text, so one goes between the two rows
  const { schema } = wrappedBlock.type;
  const pushedOutRow = pushedOutBlock
    ? [
        schema.nodes.paragraph.create(),
        wrappedBlock.type.create(
          { wrap },
          columnType.create({ columnType: "block" }, pushedOutBlock),
        ),
      ]
    : [];

  const { above, below } = getTextMovedOut(textBefore, textAfter);
  return {
    above,
    wrappedBlock: wrappedBlock.type.create(
      { ...wrappedBlock.attrs, wrap },
      Fragment.from(columns),
    ),
    below: [...pushedOutRow, ...below],
    newColumnIndex: columns.indexOf(newColumn),
  };
}
