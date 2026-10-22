import type { WrappedBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";

/**
 * Where one of a wrapped block's columns starts
 * @param wrappedBlockPos Where the wrapped block starts
 * @param wrapped block The wrapped block
 * @param index Which column, counted from the left
 * @returns The column's position
 */
export function getColumnPos(
  wrappedBlockPos: number,
  wrappedBlock: WrappedBlockNode,
  index: number,
): number {
  let pos = wrappedBlockPos + 1;
  for (let i = 0; i < index; i++) pos += wrappedBlock.child(i).nodeSize;
  return pos;
}
