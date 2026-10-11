import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { TextRemovalPreview } from "@/tiptap/extensions/ResizePreview/resizePreviewPlugin";
import type { BlockRow, RowColumn } from "./getBlockRow";
import { Fragment } from "@tiptap/pm/model";

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

// The two lines that meet when text moves into the other text, which become
// one line when both are lines of text: the moved text's last line and the
// other text's first for left text, or the other's last and the moved first
function getMeetingLines(
  removed: RowColumn,
  other: RowColumn,
  side: "left" | "right",
) {
  const [first, second] =
    side === "left"
      ? [removed.node.lastChild, other.node.firstChild]
      : [other.node.lastChild, removed.node.firstChild];

  const joins =
    !!first &&
    !!second &&
    first.isTextblock &&
    second.isTextblock &&
    first.canAppend(second);
  return { first, second, joins };
}

/**
 * What removing the pushed text will look like, for the preview while dragging
 * @param row What was around the block when the resize started
 * @param side The side the removed text is on
 * @returns The text column to hide, the other text's line that joins the
 * moved text, and a ghost of the text where it goes
 */
export function getTextRemovalPreview(
  row: BlockRow,
  side: "left" | "right",
): TextRemovalPreview {
  const { removed, other, moveTo } = getTextMove(row, side);
  if (!removed) return null;

  const preview = {
    from: removed.pos,
    to: removed.pos + removed.node.nodeSize,
    moveTo,
    content: isEmptyText(removed.node) ? null : removed.node.content,
    joinedLine: null,
  };
  if (!preview.content || !other) return preview;

  const { first, second, joins } = getMeetingLines(removed, other, side);
  if (!joins || !first || !second) return preview;

  // the ghost shows the two lines as one, in place of the other text's line
  const joined = first.copy(first.content.append(second.content));
  const lines: ProseMirrorNode[] = [];
  removed.node.forEach((line) => lines.push(line));
  const otherEnd = other.pos + other.node.nodeSize - 1;

  return {
    ...preview,
    content: Fragment.fromArray(
      side === "left"
        ? [...lines.slice(0, -1), joined]
        : [joined, ...lines.slice(1)],
    ),
    joinedLine:
      side === "left"
        ? { from: other.pos + 1, to: other.pos + 1 + second.nodeSize }
        : { from: otherEnd - first.nodeSize, to: otherEnd },
  };
}

/**
 * Removes the text column the block was pushed into and grows the block into
 * its space. Its text moves to the row's other text column, joining the
 * line it meets there, or above or below the row. Empty text is just removed
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

    if (other && getMeetingLines(removed, other, side).joins) {
      tr.join(side === "left" ? insertAt + content.size : insertAt);
    }
  }

  editor.view.dispatch(tr);
}
