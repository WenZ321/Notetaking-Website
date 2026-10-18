import type { WrappedBlockDropOutcome } from "./buildWrappedBlockDrop";
import { sumNodeSizes } from "../sumNodeSizes";
import { getBlockPosInColumn } from "../getBlockPosInColumn";

/**
 * Where the dropped block starts once a wrapped block drop is placed. It sits just
 * inside its column, after the text above the wrapped block and the columns before it
 * @param wrappedBlockStart Where the text above, or the wrapped block itself, begins
 * @param outcome The wrapped block drop
 * @returns The dropped block's position
 */
export function getDroppedBlockPos(
  wrappedBlockStart: number,
  { above, wrappedBlock, draggedColumnIndex }: WrappedBlockDropOutcome,
): number {
  return getBlockPosInColumn(
    wrappedBlockStart + sumNodeSizes(above),
    wrappedBlock.content.content,
    draggedColumnIndex,
  );
}
