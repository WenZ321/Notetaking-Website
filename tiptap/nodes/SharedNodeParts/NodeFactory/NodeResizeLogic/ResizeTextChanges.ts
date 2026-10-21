import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MovedTextColumnPreviewState } from "@/tiptap/extensions/MovedTextColumnPreview/MovedTextColumnPreviewPlugin";
import type { BlockSurroundings, ColumnInfo } from "./GetBlockSurroundings";
import { Fragment } from "@tiptap/pm/model";
import { canJoinLines } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { fitWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/FitWrappedBlockText";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// The changes a resize makes to the text around a block once it's let go:
// adding a text column, moving a text column out, and moving overflowing lines

// <!---- Adding a text column ----!>

/**
 * Turns the gap a resize left beside the block into an empty text column,
 * so the block's other edge stays where it was
 * @param editor The editor
 * @param wrapped block What was around the block when the resize started
 * @param side The side the gap is on
 * @param gap How wide the gap is
 */
export function addTextColumnOnResize(
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
  dispatchChange(editor.view, tr, "ownStep");
}

// <!---- Moving a text column out ----!>

function isEmptyText(column: ProseMirrorNode) {
  let isEmpty = true;
  column.forEach((child) => {
    if (!child.isTextblock || child.content.size > 0) isEmpty = false;
  });
  return isEmpty;
}

// The text column being moved, the wrapped block's other text column, and where
// its text goes: first in the other text for left text and last for
// right text, or above the wrapped block for left text and below it for right text
function getTextMove(surroundings: BlockSurroundings, side: "left" | "right") {
  const movedColumn =
    side === "left" ? surroundings.textBefore : surroundings.textAfter;
  const other =
    side === "left" ? surroundings.textAfter : surroundings.textBefore;

  let moveTo =
    side === "left"
      ? surroundings.wrappedBlockStart
      : surroundings.wrappedBlockEnd;
  if (other) {
    moveTo =
      side === "left" ? other.pos + 1 : other.pos + other.node.nodeSize - 1;
  }
  return { movedColumn, other, moveTo };
}

// The two lines that meet when text moves into the other text, which become
// one line when both are lines of text: the moved text's last line and the
// other text's first for left text, or the other's last and the moved first
function getMeetingLines(
  movedColumn: ColumnInfo,
  other: ColumnInfo,
  side: "left" | "right",
) {
  const [first, second] =
    side === "left"
      ? [movedColumn.node.lastChild, other.node.firstChild]
      : [other.node.lastChild, movedColumn.node.firstChild];

  const joins = canJoinLines(first, second);
  return { first, second, joins };
}

/**
 * What moving the text column will look like, for the preview while dragging
 * @param wrapped block What was around the block when the resize started
 * @param side The side the moved text column is on
 * @returns The text column to hide, the other text's line that joins the
 * moved text, and a ghost of the text where it goes
 */
export function getMovedTextColumnPreview(
  surroundings: BlockSurroundings,
  side: "left" | "right",
): MovedTextColumnPreviewState {
  const { movedColumn, other, moveTo } = getTextMove(surroundings, side);
  if (!movedColumn) return null;

  const preview = {
    from: movedColumn.pos,
    to: movedColumn.pos + movedColumn.node.nodeSize,
    moveTo,
    content: isEmptyText(movedColumn.node) ? null : movedColumn.node.content,
    joinedLine: null,
  };
  if (!preview.content || !other) return preview;

  const { first, second, joins } = getMeetingLines(movedColumn, other, side);
  if (!joins || !first || !second) return preview;

  // the ghost shows the two lines as one, in place of the other text's line
  const joined = first.copy(first.content.append(second.content));
  const lines: ProseMirrorNode[] = [];
  movedColumn.node.forEach((line) => lines.push(line));
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
 * Takes away the text column the block was widened into and grows the block into
 * its space. Its text moves to the wrapped block's other text column, joining the
 * line it meets there, or above or below the wrapped block. Empty text is just dropped
 * @param editor The editor
 * @param wrapped block What was around the block when the resize started
 * @param side The side the moved text column is on
 * @param blockPos Where the block starts
 * @param blockWidth The block's width once it fills the space
 */
export function moveTextColumnOnResize(
  editor: Editor,
  surroundings: BlockSurroundings,
  side: "left" | "right",
  blockPos: number,
  blockWidth: number,
) {
  const { movedColumn, other, moveTo } = getTextMove(surroundings, side);
  if (!movedColumn) return;

  const { tr } = editor.state;
  tr.setNodeAttribute(blockPos, "width", blockWidth);
  tr.delete(movedColumn.pos, movedColumn.pos + movedColumn.node.nodeSize);

  if (!isEmptyText(movedColumn.node)) {
    const { content } = movedColumn.node;
    const insertAt = tr.mapping.map(moveTo);
    tr.insert(insertAt, content);

    if (other && getMeetingLines(movedColumn, other, side).joins) {
      tr.join(side === "left" ? insertAt + content.size : insertAt);
    }
  }

  dispatchChange(editor.view, tr, "ownStep");
}

// <!---- Moving overflowing lines ----!>

/**
 * Cuts the wrapped block's text to the wrapped block's new size once a resize ends, moving
 * the lines that no longer fit above or below the wrapped block. It joins the
 * resize's undo step, so one undo puts both back
 * @param editor The editor
 * @param blockPos Where the resized block starts
 */
export function moveOverflowTextOnResize(editor: Editor, blockPos: number) {
  const { state, view } = editor;
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return;

  const wrappedBlockPos = $block.before($block.depth - 1);
  const fitted = fitWrappedBlockText(view, wrappedBlockPos);
  const wrappedBlock = state.doc.nodeAt(wrappedBlockPos);
  if (!fitted || !wrappedBlock) return;

  const tr = state.tr.replaceWith(
    wrappedBlockPos,
    wrappedBlockPos + wrappedBlock.nodeSize,
    [...fitted.above, fitted.wrappedBlock, ...fitted.below],
  );

  dispatchChange(view, tr, "joinLastStep");
}
