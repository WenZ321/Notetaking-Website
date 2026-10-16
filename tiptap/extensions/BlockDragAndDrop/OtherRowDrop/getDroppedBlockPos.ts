import type { RowDropOutcome } from "./buildOtherRowDrop";

/**
 * Where the dropped block starts once a row drop is placed. It sits just
 * inside its column, after the text above the row and the columns before it
 * @param rowStart Where the text above, or the row itself, begins
 * @param result The row drop
 * @returns The dropped block's position
 */
export function getDroppedBlockPos(
  rowStart: number,
  { above, row, draggedColumnIndex }: RowDropOutcome,
): number {
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  const columnsBefore = row.content.content
    .slice(0, draggedColumnIndex)
    .reduce((sum, column) => sum + column.nodeSize, 0);

  return rowStart + aboveSize + 1 + columnsBefore + 1;
}
