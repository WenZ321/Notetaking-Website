import type { EditorState } from "@tiptap/pm/state";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

/**
 * Where every block in a block's row starts, left to right, including the
 * block itself. A block outside a row is the only one
 * @param state The editor state
 * @param blockPos Where the block starts
 * @returns The blocks' positions
 */
export function getRowBlockPositions(
  state: EditorState,
  blockPos: number,
): number[] {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return [blockPos];

  const rowDepth = $block.depth - 1;
  const rowStart = $block.before(rowDepth);
  const positions: number[] = [];
  $block.node(rowDepth).forEach((column, offset) => {
    // the block sits just inside its column
    if (!isTextColumn(column)) positions.push(rowStart + 1 + offset + 1);
  });
  return positions;
}
