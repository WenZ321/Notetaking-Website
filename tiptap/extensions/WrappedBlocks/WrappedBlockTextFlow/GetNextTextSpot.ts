import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { getColumnPos } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/GetColumnPos";

// Where a text column's extra lines go when typing pushes them out: the
// start of the next text column in the wrapped block, or the page just below the wrapped block
export type NextTextSpot = {
  pos: number;
  column: ProseMirrorNode | null; // the next text column, or null for the page below
};

/**
 * Finds where a text column's extra lines go, which is also where the
 * lines that can flow back into it wait
 * @param wrappedBlockPos Where the wrapped block starts
 * @param wrapped block The wrapped block
 * @param columnIndex Which column the lines leave
 * @returns The spot
 */
export function getNextTextSpot(
  wrappedBlockPos: number,
  wrappedBlock: ProseMirrorNode,
  columnIndex: number,
): NextTextSpot {
  for (let i = columnIndex + 1; i < wrappedBlock.childCount; i++) {
    const column = wrappedBlock.child(i);
    if (isTextColumn(column)) {
      return {
        pos: getColumnPos(wrappedBlockPos, wrappedBlock, i) + 1,
        column,
      };
    }
  }
  return { pos: wrappedBlockPos + wrappedBlock.nodeSize, column: null };
}
