import type { Editor } from "@tiptap/core";
import type { BlockRow } from "./getBlockRow";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

/**
 * Turns the gap a resize left beside the block into an empty text column,
 * so the block's other edge stays where it was
 * @param editor The editor
 * @param row What was around the block when the resize started
 * @param side The side the gap is on
 * @param gap How wide the gap is
 * @param startWidth The block's width when the resize started
 */
export function fillGapWithText(
  editor: Editor,
  row: BlockRow,
  side: "left" | "right",
  gap: number,
  startWidth: number,
) {
  const { schema, tr } = editor.state;
  const column = schema.nodes.WrappedColumn.create(
    { columnType: "text", width: side === "left" ? gap : null },
    schema.nodes.paragraph.create(),
  );

  if (side === "left") {
    tr.insert(row.columnStart, column);
  } else {
    tr.insert(row.columnEnd, column);

    // the text on the left saves the width it had, which was whatever the
    // block left over, so it doesn't change once text is on both sides
    if (row.leftText) {
      tr.setNodeAttribute(
        row.leftText.pos,
        "width",
        NOTEBOOK_PAGE_WIDTH - startWidth,
      );
    }
  }

  editor.view.dispatch(tr);
}
