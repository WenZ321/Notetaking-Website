import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { ActiveDrag } from "../DragState";
import type { MeasuredRow, PagePoint } from "../DragUtils";
import type { DropTarget } from "../PageChange";
import { addBlockToRow } from "@/tiptap/extensions/WrappedBlocks/AddBlockToRow";
import {
  getBlockPosInColumn,
  sumNodeSizes,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { getGapIndex } from "../DragUtils";

/**
 * The block joins another row, in the gap between its blocks the cursor is
 * over, built the same way as inserting a block there
 * @param drag The drag
 * @param row The row it joins
 * @param cursor The cursor on the page
 * @param wrap The side the row wraps to afterward
 * @param snapBlockSide How the page's paper fits block sizes
 * @returns The target, or null when the block doesn't fit
 */
export function joinRow(
  drag: ActiveDrag,
  row: MeasuredRow,
  cursor: PagePoint,
  wrap: "left" | "right",
  snapBlockSide: SnapBlockSide,
): DropTarget | null {
  const insertIndex = getGapIndex(row.blocks, cursor.left);
  const newRow = addBlockToRow({
    wrappedBlock: drag.startState.doc.nodeAt(row.start)!,
    wrap,
    insertIndex,
    newBlock: drag.block,
    newBlockMinSize: drag.blockMinSize,
    existingBlockMinSizes: row.blocks.map((block) => block.minSize),
    snapBlockSide,
  });
  if (!newRow) return null;

  const { above, wrappedBlock, below, newColumnIndex } = newRow;
  return {
    name: `join ${row.start} ${insertIndex} ${wrap}`,
    change: {
      start: row.start,
      end: row.end,
      nodes: [...above, wrappedBlock, ...below],
      blockOffset: getBlockPosInColumn(
        sumNodeSizes(above),
        wrappedBlock.content.content,
        newColumnIndex,
      ),
      includesOriginal: false,
    },
  };
}
