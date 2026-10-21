import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type {
  CustomBlockNode,
  TextLineNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { MinBlockSize } from "../ReadContentMinSize";
import { readWrappedBlockParts } from "./ReadWrappedBlockParts";
import { buildOneBlockWrappedBlockDrop } from "./OneBlockLogic/BuildOneBlockWrappedBlockDrop";

// What happens when a block is dropped into another wrapped block
export type WrappedBlockDropOutcome = {
  above: TextLineNode[]; // the stuff (paragraph) that gets pushed out from the left text column, going above the wrapped block
  wrappedBlock: WrappedBlockNode; // the new wrapped block (wrappedBlock) with the dropped block in it
  draggedColumnIndex: number; // which column in the new wrapped block is the dropped block, 0 is leftmost
  below: TextLineNode[]; // the stuff (paragraph) that gets pushed out from the right text column, going below the wrapped block
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
 * Each number of blocks has its own rule, and counts with no rule yet can't
 * be dropped into
 * @returns The new wrapped block and the text around it, or null when it
 * can't be dropped into
 */
export function buildWrappedBlockDrop(
  info: WrappedBlockDropInfo,
): WrappedBlockDropOutcome | null {
  const parts = readWrappedBlockParts(info.wrappedBlock);

  switch (parts.existingBlocks.length) {
    case 1:
      return buildOneBlockWrappedBlockDrop(info, parts);
    default:
      return null;
  }
}
