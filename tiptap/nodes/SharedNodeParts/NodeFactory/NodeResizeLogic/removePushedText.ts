import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { TextRemovalPreview } from "@/tiptap/extensions/ResizePreview/resizePreviewPlugin";
import type { BlockRow } from "./getBlockRow";
import { canJoin } from "@tiptap/pm/transform";

function isEmptyText(column: ProseMirrorNode) {
  let isEmpty = true;
  column.forEach((child) => {
    if (!child.isTextblock || child.content.size > 0) isEmpty = false;
  });
  return isEmpty;
}

// The text column being removed, the row's other text column, and where
// the removed text goes: first in the other text for left text and last for
// right text, or above the row for left text and below it for right text
function getTextMove(row: BlockRow, side: "left" | "right") {
  const removed = side === "left" ? row.textBefore : row.textAfter;
  const other = side === "left" ? row.textAfter : row.textBefore;

  let moveTo = side === "left" ? row.rowStart : row.rowEnd;
  if (other) {
    moveTo =
      side === "left" ? other.pos + 1 : other.pos + other.node.nodeSize - 1;
  }
  return { removed, other, moveTo };
}

/**
 * What removing the pushed text will look like, for the preview while dragging
 * @param row What was around the block when the resize started
 * @param side The side the removed text is on
 * @returns The text column to hide and where a ghost of its text goes
 */
export function getTextRemovalPreview(
  row: BlockRow,
  side: "left" | "right",
): TextRemovalPreview {
  const { removed, moveTo } = getTextMove(row, side);
  if (!removed) return null;

  return {
    from: removed.pos,
    to: removed.pos + removed.node.nodeSize,
    moveTo,
    content: isEmptyText(removed.node) ? null : removed.node.content,
  };
}

/**
 * Removes the text column the block was pushed into and grows the block into
 * its space. Its text moves to the row's other text column, joining the
 * paragraph it meets there, or above or below the row. Empty text is just
 * removed
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
  const { removed, other, moveTo } = getTextMove(row, side);
  if (!removed) return;

  const { tr } = editor.state;
  tr.setNodeAttribute(blockPos, "width", blockWidth);
  tr.delete(removed.pos, removed.pos + removed.node.nodeSize);

  if (!isEmptyText(removed.node)) {
    const { content } = removed.node;
    const insertAt = tr.mapping.map(moveTo);
    tr.insert(insertAt, content);

    // the two paragraphs that meet in the other text become one
    if (other) {
      const meetAt = side === "left" ? insertAt + content.size : insertAt;
      if (canJoin(tr.doc, meetAt)) tr.join(meetAt);
    }
  }

  editor.view.dispatch(tr);
}
