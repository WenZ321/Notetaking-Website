import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import {
  getColumnWidth,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

// A column in the row, where it starts and how wide it is
export type RowColumn = {
  node: ProseMirrorNode;
  pos: number;
  width: number;
};

// What sits around a block in its row, used to resize it from either side
export type BlockRow = {
  rowStart: number; // where the row starts
  rowEnd: number; // where the row ends
  blockCount: number;
  otherBlocksWidth: number; // the widths of the row's other blocks added up
  textBefore: RowColumn | null; // the closest text column before the block
  textAfter: RowColumn | null; // the closest text column after the block
  columnStart: number; // where the block's column starts
  columnEnd: number; // where the block's column ends
};

// Looks at the row the block sits in, or null when it isn't in one
export function getBlockRow(
  state: EditorState,
  blockPos: number,
): BlockRow | null {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return null;

  const rowDepth = $block.depth - 1;
  const rowStart = $block.before(rowDepth);
  const index = $block.index(rowDepth);

  const columns: RowColumn[] = [];
  $block.node(rowDepth).forEach((node, offset) => {
    columns.push({
      node,
      pos: rowStart + 1 + offset,
      width: getColumnWidth(node),
    });
  });

  const isText = (column: RowColumn) => isTextColumn(column.node);
  const otherBlocks = columns.filter(
    (column, i) => i !== index && !isText(column),
  );

  return {
    rowStart,
    rowEnd: $block.after(rowDepth),
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
