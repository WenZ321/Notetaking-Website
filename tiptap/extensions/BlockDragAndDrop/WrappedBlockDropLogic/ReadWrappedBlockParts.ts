import type {
  CustomBlockNode,
  TextColumnNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";

// The parts of a wrapped block a drop works with: its blocks, and the text
// on the far left and far right of them. Text between two blocks isn't read
// yet, since no drop rule uses it
export type WrappedBlockParts = {
  existingBlocks: CustomBlockNode[]; // left to right
  textBefore: TextColumnNode | null; // the text column left of every block
  textAfter: TextColumnNode | null; // the text column right of every block
};

// Reads the blocks and the outer text columns out of a wrapped block
export function readWrappedBlockParts(
  wrappedBlock: WrappedBlockNode,
): WrappedBlockParts {
  const columns = wrappedBlock.content.content;
  const blockColumns = columns.filter((column) => !isTextColumn(column));
  const firstBlockIndex = columns.indexOf(blockColumns[0]);
  const lastBlockIndex = columns.lastIndexOf(blockColumns.at(-1)!);

  return {
    existingBlocks: blockColumns.map((column) => column.firstChild!),
    textBefore: columns.slice(0, firstBlockIndex).find(isTextColumn) ?? null,
    textAfter: columns.slice(lastBlockIndex + 1).find(isTextColumn) ?? null,
  };
}
