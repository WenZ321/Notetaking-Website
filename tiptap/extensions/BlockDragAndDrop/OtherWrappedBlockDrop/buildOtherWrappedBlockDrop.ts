import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type {
  CustomBlockNode,
  TextLineNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/wrappedNodeTypes";
import type { MinBlockSize } from "../readContentMinSize";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { buildOneBlockWrappedBlockDrop } from "./buildOneBlockWrappedBlockDrop";

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
 * @returns The new wrapped block and the text around it
 */
export function buildOtherWrappedBlockDrop(
  info: WrappedBlockDropInfo,
): WrappedBlockDropOutcome | null {
  const blockCount = info.wrappedBlock.content.content.filter(
    (column) => !isTextColumn(column),
  ).length;

  switch (blockCount) {
    case 1:
      return buildOneBlockWrappedBlockDrop(info);
    default:
      return null;
  }
}
