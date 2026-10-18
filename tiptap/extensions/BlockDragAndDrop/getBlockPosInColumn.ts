import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { sumNodeSizes } from "./sumNodeSizes";

/**
 * Where the block in one of a wrapped block's columns starts. It sits just
 * inside its column, after the columns before it
 * @param wrappedBlockStart Where the wrapped block starts
 * @param columns The wrapped block's columns, left to right
 * @param columnIndex Which column holds the block
 * @returns The block's position
 */
export function getBlockPosInColumn(
  wrappedBlockStart: number,
  columns: readonly ProseMirrorNode[],
  columnIndex: number,
): number {
  const columnsBefore = sumNodeSizes(columns.slice(0, columnIndex));
  return wrappedBlockStart + 1 + columnsBefore + 1;
}
