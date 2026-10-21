import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/arrangeWrappedBlocks";

// How far from the wrapped block's left edge a column starts, which is the
// widths of the columns before it added up
export function getWidthBeforeColumn(
  columns: readonly ProseMirrorNode[],
  columnIndex: number,
): number {
  return columns
    .slice(0, columnIndex)
    .reduce((sum, column) => sum + getColumnWidth(column), 0);
}
