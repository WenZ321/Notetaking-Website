import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Where one of a row's columns starts
 * @param rowPos Where the row starts
 * @param row The row
 * @param index Which column, counted from the left
 * @returns The column's position
 */
export function getColumnPos(
  rowPos: number,
  row: ProseMirrorNode,
  index: number,
): number {
  let pos = rowPos + 1;
  for (let i = 0; i < index; i++) pos += row.child(i).nodeSize;
  return pos;
}
