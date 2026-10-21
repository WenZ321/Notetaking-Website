import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import {
  getColumnWidth,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/arrangeWrappedBlocks";

// A column in the wrapped block, where it starts and how wide it is
export type ColumnInfo = {
  node: ProseMirrorNode;
  pos: number;
  width: number;
};

// What sits around a block in its wrapped block, used to resize it from either side
export type BlockSurroundings = {
  wrappedBlockStart: number; // where the wrapped block starts
  wrappedBlockEnd: number; // where the wrapped block ends
  blockCount: number;
  otherBlocksWidth: number; // the widths of the wrapped block's other blocks added up
  textBefore: ColumnInfo | null; // the closest text column before the block
  textAfter: ColumnInfo | null; // the closest text column after the block
  columnStart: number; // where the block's column starts
  columnEnd: number; // where the block's column ends
};

// Looks at the wrapped block the block sits in, or null when it isn't in one
export function getBlockSurroundings(
  state: EditorState,
  blockPos: number,
): BlockSurroundings | null {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return null;

  const wrappedBlockDepth = $block.depth - 1;
  const wrappedBlockStart = $block.before(wrappedBlockDepth);
  const index = $block.index(wrappedBlockDepth);

  const columns: ColumnInfo[] = [];
  $block.node(wrappedBlockDepth).forEach((node, offset) => {
    columns.push({
      node,
      pos: wrappedBlockStart + 1 + offset,
      width: getColumnWidth(node),
    });
  });

  const isText = (column: ColumnInfo) => isTextColumn(column.node);
  const otherBlocks = columns.filter(
    (column, i) => i !== index && !isText(column),
  );

  return {
    wrappedBlockStart,
    wrappedBlockEnd: $block.after(wrappedBlockDepth),
    blockCount: otherBlocks.length + 1,
    otherBlocksWidth: otherBlocks.reduce(
      (sum, column) => sum + column.width,
      0,
    ),
    textBefore: columns.slice(0, index).findLast(isText) ?? null,
    textAfter: columns.slice(index + 1).find(isText) ?? null,
    columnStart: columns[index].pos,
    columnEnd: $block.after($block.depth),
  };
}
