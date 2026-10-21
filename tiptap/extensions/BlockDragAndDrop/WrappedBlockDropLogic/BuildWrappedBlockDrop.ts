import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type {
  CustomBlockNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { MinBlockSize } from "../ReadContentMinSize";
import {
  MAX_BLOCKS,
  getBlocksRoom,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { readWrappedBlockParts } from "./ReadWrappedBlockParts";
import { buildFitSizes, getSharedHeight } from "./DropSizes";
import { fitDroppedBlock } from "./FitDroppedBlock";
import { buildDropOutcome } from "./BuildDropOutcome";

// What happens when a block is dropped into another wrapped block
export type WrappedBlockDropOutcome = {
  wrappedBlock: WrappedBlockNode; // the new wrapped block with the dropped block in it
  draggedColumnIndex: number; // which column in the new wrapped block is the dropped block, 0 is leftmost
};

// The information about the wrapped block we are dropping a block into, and the block being dropped
export type WrappedBlockDropInfo = {
  wrappedBlock: WrappedBlockNode; // the wrapped block being dropped into
  insertIndex: number; // where among the wrapped block the dropped block goes, we ignore text columns
  // 0 [block] 1 [block] 2 [block] 3
  draggedBlock: CustomBlockNode;
  draggedBlockMinSize: MinBlockSize;
  existingBlockMinSizes: MinBlockSize[]; // each of the wrapped block's blocks, left to right
  snapBlockSide: SnapBlockSide;
};

/**
 * Builds what a wrapped block turns into when a block is dropped into it.
 * The dropped block joins the others side by side, and their widths are fit
 * into the room the wrapped block's wrap leaves for blocks
 * @returns The new wrapped block, or null when it's full or the dropped
 * block can't get its smallest width there
 */
export function buildWrappedBlockDrop({
  wrappedBlock,
  insertIndex,
  draggedBlock,
  draggedBlockMinSize,
  existingBlockMinSizes,
  snapBlockSide,
}: WrappedBlockDropInfo): WrappedBlockDropOutcome | null {
  const { existingBlocks, textBefore, textAfter } =
    readWrappedBlockParts(wrappedBlock);
  if (existingBlocks.length >= MAX_BLOCKS) return null;

  const sizes = buildFitSizes({
    existingBlocks,
    existingBlockMinSizes,
    draggedBlock,
    draggedBlockMinSize,
    snapBlockSide,
  });
  const widths = fitDroppedBlock(sizes, getBlocksRoom(wrappedBlock.attrs.wrap));
  if (!widths) return null;

  return buildDropOutcome({
    wrappedBlock,
    insertIndex,
    draggedBlock,
    existingBlocks,
    textBefore,
    textAfter,
    widths,
    height: getSharedHeight({
      existingBlocks,
      draggedBlockMinSize,
      snapBlockSide,
    }),
  });
}
