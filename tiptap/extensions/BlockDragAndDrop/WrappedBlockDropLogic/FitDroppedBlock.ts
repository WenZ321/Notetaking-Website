import type {
  WrappedBlockFitSizes,
  WrappedBlockWidths,
} from "./WrappedBlockFitTypes";

/**
 * Fits a dropped block in beside the existing blocks. The existing blocks
 * keep their widths when there's room, and the dropped block keeps its own
 * width as far as the room allows. When there isn't room for even its
 * smallest width, the existing blocks give up room, right to left, but
 * never past their own smallest width
 * @param sizes Every block's width and smallest width
 * @param room How wide all the blocks can be together
 * @returns The widths, or null when the dropped block still doesn't fit
 */
export function fitDroppedBlock(
  {
    existingBlockCurrentWidths,
    existingBlockMinWidths,
    draggedBlockCurrentWidth,
    draggedBlockMinWidth,
    snapBlockSide,
  }: WrappedBlockFitSizes,
  room: number,
): WrappedBlockWidths | null {
  const existingBlockWidths = [...existingBlockCurrentWidths];
  const usedWidth = existingBlockWidths.reduce((sum, width) => sum + width, 0);
  let freeWidth = room - usedWidth;

  for (let i = existingBlockWidths.length - 1; i >= 0; i--) {
    if (freeWidth >= draggedBlockMinWidth) break;

    const shortfall = draggedBlockMinWidth - freeWidth;
    const shrunkWidth = snapBlockSide(existingBlockWidths[i] - shortfall, {
      min: existingBlockMinWidths[i],
      max: existingBlockWidths[i],
    });
    freeWidth += existingBlockWidths[i] - shrunkWidth;
    existingBlockWidths[i] = shrunkWidth;
  }
  if (freeWidth < draggedBlockMinWidth) return null;

  const draggedBlockWidth = snapBlockSide(draggedBlockCurrentWidth, {
    min: draggedBlockMinWidth,
    max: freeWidth,
  });
  return { existingBlockWidths, draggedBlockWidth };
}
