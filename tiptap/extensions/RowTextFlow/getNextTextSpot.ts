import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { getColumnPos } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/getColumnPos";

// Where a text column's extra lines go when typing pushes them out: the
// start of the next text column in the row, or the page just below the row
export type NextTextSpot = {
  pos: number;
  column: ProseMirrorNode | null; // the next text column, or null for the page below
};

/**
 * Finds where a text column's extra lines go, which is also where the
 * lines that can flow back into it wait
 * @param rowPos Where the row starts
 * @param row The row
 * @param columnIndex Which column the lines leave
 * @returns The spot
 */
export function getNextTextSpot(
  rowPos: number,
  row: ProseMirrorNode,
  columnIndex: number,
): NextTextSpot {
  for (let i = columnIndex + 1; i < row.childCount; i++) {
    const column = row.child(i);
    if (isTextColumn(column)) {
      return { pos: getColumnPos(rowPos, row, i) + 1, column };
    }
  }
  return { pos: rowPos + row.nodeSize, column: null };
}
