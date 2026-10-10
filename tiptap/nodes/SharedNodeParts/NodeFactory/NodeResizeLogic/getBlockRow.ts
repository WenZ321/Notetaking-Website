import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";

// What sits around a block in its row, used to resize it from either side
export type BlockRow = {
  blockCount: number;
  otherBlocksWidth: number; // the widths of the row's other blocks added up
  hasTextBefore: boolean;
  hasTextAfter: boolean;
  leftText: { pos: number; width: number | null } | null; // the text column right before the block, with its saved width if any
  columnStart: number; // where the block's column starts
  columnEnd: number; // where the block's column ends
};

function isTextColumn(column: ProseMirrorNode) {
  return column.attrs.columnType === "text";
}

// Looks at the row the block sits in, or null when it isn't in one
export function getBlockRow(
  state: EditorState,
  blockPos: number,
): BlockRow | null {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return null;

  const rowDepth = $block.depth - 1;
  const index = $block.index(rowDepth);
  const columns: ProseMirrorNode[] = [];
  $block.node(rowDepth).forEach((column) => columns.push(column));

  const otherBlocks = columns.filter(
    (column, i) => i !== index && !isTextColumn(column),
  );
  const columnStart = $block.before($block.depth);
  const left = columns[index - 1];

  return {
    blockCount: otherBlocks.length + 1,
    otherBlocksWidth: otherBlocks.reduce(
      (sum, column) => sum + column.firstChild!.attrs.width,
      0,
    ),
    hasTextBefore: columns.slice(0, index).some(isTextColumn),
    hasTextAfter: columns.slice(index + 1).some(isTextColumn),
    leftText:
      left && isTextColumn(left)
        ? { pos: columnStart - left.nodeSize, width: left.attrs.width }
        : null,
    columnStart,
    columnEnd: $block.after($block.depth),
  };
}
