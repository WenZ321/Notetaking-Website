import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type {
  CustomBlockNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { MinBlockSize } from "./WrappedBlockUtils";
import { Fragment } from "@tiptap/pm/model";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookTemplates/PaperLogic/SnapBlockSizeToPaper";
import {
  MAX_BLOCKS,
  getBlocksRoom,
} from "./WrappedBlockLayout/ArrangeWrappedBlocks";
import { getTextMovedOut, readWrappedBlockParts } from "./WrappedBlockUtils";

type AddBlockToRowInfo = {
  wrappedBlock: WrappedBlockNode; // the row the block is added to
  wrap: "left" | "right"; // the side the row wraps to afterward
  insertIndex: number; // which gap between the row's blocks the new one goes in, 0 [block] 1 [block] 2
  newBlock: CustomBlockNode;
  newBlockMinSize: MinBlockSize;
  existingBlockMinSizes: MinBlockSize[]; // one per block already in the row, left to right
  snapBlockSide: SnapBlockSide;
};

// The row with the new block in it, and a newspaper's text, moved out of it
export type RowWithNewBlock = {
  above: ProseMirrorNode[]; // a newspaper's left text, moved above the row
  wrappedBlock: WrappedBlockNode;
  below: ProseMirrorNode[]; // a newspaper's right text, moved below the row
  newColumnIndex: number; // which column holds the new block, 0 is leftmost
};

/**
 * Adds a block to a row, the same way for an insert and a drop. The row
 * wraps to the given side and holds only blocks, so a newspaper's left text
 * moves above it and its right text below. The blocks already there keep
 * their widths when there's room, and give up room right to left, but never
 * past what their content needs. Every block takes the row's shared height
 * @returns The new row, or null when it's full or the new block can't get
 * its smallest width there
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
  if (existingBlocks.length >= MAX_BLOCKS) return null;

  // a smallest width rounds up to the paper, never below what the content needs
  const snapMinSide = (contentMin: number, blockMin: number) => {
    const min = Math.max(blockMin, contentMin);
    return snapBlockSide(min, { min, max: Infinity });
  };

  // a block already narrower than its smallest width isn't made to grow
  const widths = existingBlocks.map((block) => block.attrs.width as number);
  const minWidths = existingBlockMinSizes.map((minSize, index) =>
    Math.min(widths[index], snapMinSide(minSize.width, MIN_BLOCK_WIDTH)),
  );
  const newBlockMinWidth = snapMinSide(newBlockMinSize.width, MIN_BLOCK_WIDTH);

  // the blocks already there give up room, right to left, until the new
  // block fits at its smallest width
  let freeWidth =
    getBlocksRoom(wrap) - widths.reduce((sum, width) => sum + width, 0);
  for (let i = widths.length - 1; i >= 0; i--) {
    if (freeWidth >= newBlockMinWidth) break;

    const shortfall = newBlockMinWidth - freeWidth;
    const shrunkWidth = snapBlockSide(widths[i] - shortfall, {
      min: minWidths[i],
      max: widths[i],
    });
    freeWidth += widths[i] - shrunkWidth;
    widths[i] = shrunkWidth;
  }
  if (freeWidth < newBlockMinWidth) return null;

  const newBlockWidth = snapBlockSide(newBlock.attrs.width as number, {
    min: newBlockMinWidth,
    max: freeWidth,
  });

  // the tallest block, or taller when the new block's content needs it
  const height = Math.max(
    ...existingBlocks.map((block) => block.attrs.height as number),
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
  const existingColumns = existingBlocks.map((block, index) =>
    toBlockColumn(block, widths[index]),
  );
  const columns = [
    ...existingColumns.slice(0, insertIndex),
    newColumn,
    ...existingColumns.slice(insertIndex),
  ];

  const { above, below } = getTextMovedOut(textBefore, textAfter);
  return {
    above,
    wrappedBlock: wrappedBlock.type.create(
      { ...wrappedBlock.attrs, wrap },
      Fragment.from(columns),
    ),
    below,
    newColumnIndex: columns.indexOf(newColumn),
  };
}
