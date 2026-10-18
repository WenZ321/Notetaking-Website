import type {
  CustomBlockNode,
  TextColumnNode,
  TextLineNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/wrappedNodeTypes";
import type { WrappedBlockDropOutcome } from "./buildWrappedBlockDrop";
import type { WrappedBlockWidths } from "./wrappedBlockFitTypes";
import { Fragment } from "@tiptap/pm/model";
import { isEmptyTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/isEmptyTextColumn";

type DropOutcomeOptions = {
  wrappedBlock: WrappedBlockNode;
  insertIndex: number; // which gap between the existing blocks the dropped block goes in, 0 [block] 1 [block] 2
  draggedBlock: CustomBlockNode;
  existingBlocks: CustomBlockNode[]; // the blocks already in the wrapped block, left to right
  textBefore: TextColumnNode | null;
  textAfter: TextColumnNode | null;
  keptText: TextColumnNode | null; // the text that stays when it fits
  widths: WrappedBlockWidths;
  height: number; // the height all blocks share
};

/**
 * Turns the fitted widths into the new wrapped block. The blocks sit side by
 * side with the dropped one in its gap, and kept text stays on its side.
 * Text that leaves goes above when it was on the left and below when it was
 * on the right, unless it was empty
 * @returns The new wrapped block and the text around it
 */
export function buildDropOutcome({
  wrappedBlock,
  insertIndex,
  draggedBlock,
  existingBlocks,
  textBefore,
  textAfter,
  keptText,
  widths,
  height,
}: DropOutcomeOptions): WrappedBlockDropOutcome {
  const columnType = wrappedBlock.child(0).type;
  const toBlockColumn = (block: CustomBlockNode, width: number) =>
    columnType.create(
      { columnType: "block" },
      block.type.create(
        { ...block.attrs, width, height },
        block.content,
        block.marks,
      ),
    );

  const draggedColumn = toBlockColumn(draggedBlock, widths.draggedBlockWidth);
  const existingColumns = existingBlocks.map((block, index) =>
    toBlockColumn(block, widths.existingBlockWidths[index]),
  );
  const blockColumns = [
    ...existingColumns.slice(0, insertIndex),
    draggedColumn,
    ...existingColumns.slice(insertIndex),
  ];

  const above: TextLineNode[] = [];
  const below: TextLineNode[] = [];
  const leave = (column: TextColumnNode | null) => {
    if (!column || isEmptyTextColumn(column)) return;
    const lines = column.content.content;
    if (column === textBefore) above.push(...lines);
    else below.push(...lines);
  };

  // with text on both sides, the one that isn't kept always leaves
  if (textBefore && textAfter) {
    leave(keptText === textBefore ? textAfter : textBefore);
  }

  let columns = blockColumns;
  if (keptText && widths.textWidth !== null) {
    const textColumn = columnType.create(
      { columnType: "text", width: widths.textWidth },
      keptText.content,
    );
    columns =
      keptText === textBefore
        ? [textColumn, ...blockColumns]
        : [...blockColumns, textColumn];
  } else {
    leave(keptText);
  }

  return {
    above,
    wrappedBlock: wrappedBlock.copy(Fragment.from(columns)),
    draggedColumnIndex: columns.indexOf(draggedColumn),
    below,
  };
}
