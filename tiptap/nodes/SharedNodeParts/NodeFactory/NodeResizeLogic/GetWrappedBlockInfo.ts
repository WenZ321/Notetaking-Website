import type { WrappedColumnNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { EditorState } from "@tiptap/pm/state";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import {
  getColumnWidth,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

// A column in the wrapped block, where it starts and how wide it is
export type ColumnInfo = {
  node: WrappedColumnNode;
  pos: number;
  width: number;
};

// Everything about the wrapped block a block sits in, used to resize and
// move the block
export type WrappedBlockInfo = {
  wrappedBlockStart: number; // where the wrapped block starts
  wrappedBlockEnd: number; // where the wrapped block ends
  wrap: Wrap; // how the wrapped block sits with its text
  blockPositions: number[]; // where every block in it starts, left to right, including this one
  otherBlocksWidth: number; // the widths of the wrapped block's other blocks added up
  textBefore: ColumnInfo | null; // a newspaper's text column on the block's left, null otherwise
  textAfter: ColumnInfo | null; // a newspaper's text column on the block's right, null otherwise
  columnStart: number; // where the block's own column starts
};

/**
 * Looks at the wrapped block a block sits in. Every custom block lives in one
 * @param state The editor state
 * @param blockPos Where the block starts
 * @returns Everything about its wrapped block
 */
export function getWrappedBlockInfo(
  state: EditorState,
  blockPos: number,
): WrappedBlockInfo {
  const $block = state.doc.resolve(blockPos);
  const wrappedBlockDepth = $block.depth - 1;
  const wrappedBlock = $block.node(wrappedBlockDepth);
  const wrappedBlockStart = $block.before(wrappedBlockDepth);
  const index = $block.index(wrappedBlockDepth);

  const columns: ColumnInfo[] = [];
  wrappedBlock.forEach((node, offset) => {
    columns.push({
      node,
      pos: wrappedBlockStart + 1 + offset,
      width: getColumnWidth(node),
    });
  });

  // a text column holds only text, no custom block. Only a newspaper has them
  const isText = (column: ColumnInfo) => isTextColumn(column.node);
  const blockColumns = columns.filter((column) => !isText(column));
  const otherBlockColumns = blockColumns.filter(
    (column) => column !== columns[index],
  );

  return {
    wrappedBlockStart,
    wrappedBlockEnd: $block.after(wrappedBlockDepth),
    wrap: wrappedBlock.attrs.wrap,
    // a block sits just inside its column
    blockPositions: blockColumns.map((column) => column.pos + 1),
    otherBlocksWidth: otherBlockColumns.reduce(
      (sum, column) => sum + column.width,
      0,
    ),
    textBefore: columns.slice(0, index).findLast(isText) ?? null,
    textAfter: columns.slice(index + 1).find(isText) ?? null,
    columnStart: columns[index].pos,
  };
}
