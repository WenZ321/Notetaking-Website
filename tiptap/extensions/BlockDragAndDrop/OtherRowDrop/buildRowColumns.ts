import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { OtherRowDrop } from "./buildOtherRowDrop";
import type { RowWidths } from "./rowFitTypes";
import { Fragment } from "@tiptap/pm/model";
import { isEmptyTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/isEmptyTextColumn";

type RowColumnsOptions = {
  rowNode: ProseMirrorNode;
  side: "left" | "right"; // which side of the row's block the dropped one goes
  dragged: ProseMirrorNode;
  rowBlock: ProseMirrorNode;
  textBefore: ProseMirrorNode | null;
  textAfter: ProseMirrorNode | null;
  keptText: ProseMirrorNode | null; // the text that stays when it fits
  widths: RowWidths;
  height: number; // the height both blocks share
};

/**
 * Turns the fitted widths into the new row. The two blocks sit side by
 * side and kept text stays on its side. Text that leaves goes above when it
 * was on the left and below when it was on the right, unless it was empty
 * @returns The new row and the text around it
 */
export function buildRowColumns({
  rowNode,
  side,
  dragged,
  rowBlock,
  textBefore,
  textAfter,
  keptText,
  widths,
  height,
}: RowColumnsOptions): OtherRowDrop {
  const columnType = rowNode.child(0).type;
  const toBlockColumn = (block: ProseMirrorNode, width: number) =>
    columnType.create(
      { columnType: "block" },
      block.type.create(
        { ...block.attrs, width, height },
        block.content,
        block.marks,
      ),
    );

  const draggedColumn = toBlockColumn(dragged, widths.dragged);
  const rowBlockColumn = toBlockColumn(rowBlock, widths.rowBlock);
  const blockColumns =
    side === "left"
      ? [draggedColumn, rowBlockColumn]
      : [rowBlockColumn, draggedColumn];

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
  if (keptText && widths.text !== null) {
    const textColumn = columnType.create(
      { columnType: "text", width: widths.text },
      keptText.content,
    );
    columns =
      keptText === textBefore
        ? [textColumn, ...blockColumns]
        : [...blockColumns, textColumn];
  } else {
    leave(keptText);
  }

  return { above, row: rowNode.copy(Fragment.from(columns)), below };
}
