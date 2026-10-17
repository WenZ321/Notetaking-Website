import type { Editor } from "@tiptap/core";
import type { BlockSurroundings } from "./getBlockSurroundings";

/**
 * Turns the gap a resize left beside the block into an empty text column,
 * so the block's other edge stays where it was
 * @param editor The editor
 * @param wrapped block What was around the block when the resize started
 * @param side The side the gap is on
 * @param gap How wide the gap is
 */
export function fillGapWithText(
  editor: Editor,
  surroundings: BlockSurroundings,
  side: "left" | "right",
  gap: number,
) {
  const { schema, tr } = editor.state;
  const column = schema.nodes.WrappedColumn.create(
    { columnType: "text", width: gap },
    schema.nodes.paragraph.create(),
  );

  tr.insert(
    side === "left" ? surroundings.columnStart : surroundings.columnEnd,
    column,
  );
  editor.view.dispatch(tr);
}
