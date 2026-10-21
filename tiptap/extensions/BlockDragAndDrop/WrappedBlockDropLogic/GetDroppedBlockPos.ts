import type { WrappedBlockDropOutcome } from "./BuildWrappedBlockDrop";
import { getBlockPosInColumn } from "../GetBlockPosInColumn";

/**
 * Where the dropped block starts once a wrapped block drop is placed. It sits just
 * inside its column, after the columns before it
 * @param wrappedBlockStart Where the wrapped block starts
 * @param outcome The wrapped block drop
 * @returns The dropped block's position
 */
export function getDroppedBlockPos(
  wrappedBlockStart: number,
  { wrappedBlock, draggedColumnIndex }: WrappedBlockDropOutcome,
): number {
  return getBlockPosInColumn(
    wrappedBlockStart,
    wrappedBlock.content.content,
    draggedColumnIndex,
  );
}
