import type { EditorState } from "@tiptap/pm/state";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/arrangeWrappedBlocks";

/**
 * Where every block in a block's wrapped block starts, left to right, including the
 * block itself. A block outside a wrapped block is the only one
 * @param state The editor state
 * @param blockPos Where the block starts
 * @returns The blocks' positions
 */
export function getBlockPositionsInWrappedBlock(
  state: EditorState,
  blockPos: number,
): number[] {
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return [blockPos];

  const wrappedBlockDepth = $block.depth - 1;
  const wrappedBlockStart = $block.before(wrappedBlockDepth);
  const positions: number[] = [];
  $block.node(wrappedBlockDepth).forEach((column, offset) => {
    // the block sits just inside its column
    if (!isTextColumn(column))
      positions.push(wrappedBlockStart + 1 + offset + 1);
  });
  return positions;
}
