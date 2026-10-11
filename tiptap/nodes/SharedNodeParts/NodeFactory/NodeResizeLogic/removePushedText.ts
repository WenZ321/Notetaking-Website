import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { BlockRow } from "./getBlockRow";
import { canJoin } from "@tiptap/pm/transform";

function isEmptyText(column: ProseMirrorNode) {
  let isEmpty = true;
  column.forEach((child) => {
    if (!child.isTextblock || child.content.size > 0) isEmpty = false;
  });
  return isEmpty;
}

/**
 * Removes the text column the block was pushed into and grows the block into
 * its space. Its text moves to the row's other text column, joining the
 * paragraph it meets there, or above the row for left text and below it for
 * right text. Empty text is just removed
 * @param editor The editor
 * @param row What was around the block when the resize started
 * @param side The side the removed text is on
 * @param blockPos Where the block starts
 * @param blockWidth The block's width once it fills the space
 */
export function removePushedText(
  editor: Editor,
  row: BlockRow,
  side: "left" | "right",
  blockPos: number,
  blockWidth: number,
) {
  const removed = side === "left" ? row.textBefore : row.textAfter;
  if (!removed) return;

  const other = side === "left" ? row.textAfter : row.textBefore;
  const { tr } = editor.state;

  tr.setNodeAttribute(blockPos, "width", blockWidth);
  tr.delete(removed.pos, removed.pos + removed.node.nodeSize);

  if (!isEmptyText(removed.node)) {
    const { content } = removed.node;

    if (!other) {
      tr.insert(
        tr.mapping.map(side === "left" ? row.rowStart : row.rowEnd),
        content,
      );
    } else {
      // left text goes first in the other text, right text goes last, and the
      // two paragraphs that meet become one
      const moveTo = tr.mapping.map(
        side === "left" ? other.pos + 1 : other.pos + other.node.nodeSize - 1,
      );
      tr.insert(moveTo, content);

      const meetAt = side === "left" ? moveTo + content.size : moveTo;
      if (canJoin(tr.doc, meetAt)) tr.join(meetAt);
    }
  }

  editor.view.dispatch(tr);
}
