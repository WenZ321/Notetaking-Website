import type {
  CustomBlockNode,
  TextColumnNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { WrappedBlockDropOutcome } from "./BuildWrappedBlockDrop";
import type { WrappedBlockWidths } from "./WrappedBlockFitTypes";
import { Fragment } from "@tiptap/pm/model";
import { getNewspaperTextWidths } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";

type DropOutcomeOptions = {
  wrappedBlock: WrappedBlockNode;
  insertIndex: number; // which gap between the existing blocks the dropped block goes in, 0 [block] 1 [block] 2
  draggedBlock: CustomBlockNode;
  existingBlocks: CustomBlockNode[]; // the blocks already in the wrapped block, left to right
  textBefore: TextColumnNode | null; // a newspaper's left text
  textAfter: TextColumnNode | null; // a newspaper's right text
  widths: WrappedBlockWidths;
  height: number; // the height all blocks share
};

/**
 * Turns the fitted widths into the new wrapped block. The blocks sit side by
 * side with the dropped one in its gap. A newspaper keeps its text on both
 * sides, with the widths the wrapped block rules would give it
 * @returns The new wrapped block
 */
export function buildDropOutcome({
  wrappedBlock,
  insertIndex,
  draggedBlock,
  existingBlocks,
  textBefore,
  textAfter,
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

  let columns = blockColumns;
  if (textBefore && textAfter) {
    const blocksWidth =
      widths.draggedBlockWidth +
      widths.existingBlockWidths.reduce((sum, width) => sum + width, 0);
    const [leftWidth, rightWidth] = getNewspaperTextWidths(
      blocksWidth,
      textBefore.attrs.width,
    );
    columns = [
      textBefore.type.create(
        { ...textBefore.attrs, width: leftWidth },
        textBefore.content,
      ),
      ...blockColumns,
      textAfter.type.create(
        { ...textAfter.attrs, width: rightWidth },
        textAfter.content,
      ),
    ];
  }

  return {
    wrappedBlock: wrappedBlock.copy(Fragment.from(columns)),
    draggedColumnIndex: columns.indexOf(draggedColumn),
  };
}
