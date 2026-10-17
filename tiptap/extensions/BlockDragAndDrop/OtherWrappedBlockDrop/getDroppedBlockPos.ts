import type { WrappedBlockDropOutcome } from "./buildOtherWrappedBlockDrop";

/**
 * Where the dropped block starts once a wrapped block drop is placed. It sits just
 * inside its column, after the text above the wrapped block and the columns before it
 * @param wrappedBlockStart Where the text above, or the wrapped block itself, begins
 * @param result The wrapped block drop
 * @returns The dropped block's position
 */
export function getDroppedBlockPos(
  wrappedBlockStart: number,
  { above, wrappedBlock, draggedColumnIndex }: WrappedBlockDropOutcome,
): number {
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  const columnsBefore = wrappedBlock.content.content
    .slice(0, draggedColumnIndex)
    .reduce((sum, column) => sum + column.nodeSize, 0);

  return wrappedBlockStart + aboveSize + 1 + columnsBefore + 1;
}
