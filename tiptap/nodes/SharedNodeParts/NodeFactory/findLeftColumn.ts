import type { EditorState } from "@tiptap/pm/state";

// The column just left of the block's column in its row, and where it
// starts, or null when the block is in the first column
export function findLeftColumn(state: EditorState, blockPos: number) {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return null;

  const rowDepth = $block.depth - 1;
  const columnIndex = $block.index(rowDepth);
  if (columnIndex === 0) return null;

  const node = $block.node(rowDepth).child(columnIndex - 1);
  const pos = $block.before($block.depth) - node.nodeSize;
  return { node, pos };
}
