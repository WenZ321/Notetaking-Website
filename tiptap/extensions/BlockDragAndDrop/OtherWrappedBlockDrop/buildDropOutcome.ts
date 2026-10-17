import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { WrappedBlockDropOutcome } from "./buildOtherWrappedBlockDrop";
import type { WrappedBlockWidths } from "./wrappedBlockFitTypes";
import { Fragment } from "@tiptap/pm/model";
import { isEmptyTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/isEmptyTextColumn";

type DropOutcomeOptions = {
  wrappedBlock: ProseMirrorNode;
  side: "left" | "right"; // which side of the existing block the dropped one goes
  draggedBlock: ProseMirrorNode;
  existingBlock: ProseMirrorNode;
  textBefore: ProseMirrorNode | null;
  textAfter: ProseMirrorNode | null;
  keptText: ProseMirrorNode | null; // the text that stays when it fits
  widths: WrappedBlockWidths;
  height: number; // the height both blocks share
};

/**
 * Turns the fitted widths into the new wrapped block. The two blocks sit side by
 * side and kept text stays on its side. Text that leaves goes above when it
 * was on the left and below when it was on the right, unless it was empty
 * @returns The new wrapped block and the text around it
 */
export function buildDropOutcome({
  wrappedBlock,
  side,
  draggedBlock,
  existingBlock,
  textBefore,
  textAfter,
  keptText,
  widths,
  height,
}: DropOutcomeOptions): WrappedBlockDropOutcome {
  const columnType = wrappedBlock.child(0).type;
  const toBlockColumn = (block: ProseMirrorNode, width: number) =>
    columnType.create(
      { columnType: "block" },
      block.type.create(
        { ...block.attrs, width, height },
        block.content,
        block.marks,
      ),
    );

  const draggedColumn = toBlockColumn(draggedBlock, widths.draggedBlockWidth);
  const existingBlockColumn = toBlockColumn(
    existingBlock,
    widths.existingBlockWidth,
  );
  const blockColumns =
    side === "left"
      ? [draggedColumn, existingBlockColumn]
      : [existingBlockColumn, draggedColumn];

  const above: ProseMirrorNode[] = [];
  const below: ProseMirrorNode[] = [];
  const leave = (column: ProseMirrorNode | null) => {
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
