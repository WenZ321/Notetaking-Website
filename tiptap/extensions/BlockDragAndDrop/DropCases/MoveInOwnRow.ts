import type {
  TextLineNode,
  WrappedColumnNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { EditorState } from "@tiptap/pm/state";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import type { ActiveDrag } from "../DragState";
import type { MeasuredRow, PagePoint } from "../DragUtils";
import type { DropTarget, PageChange } from "../PageChange";
import { Fragment } from "@tiptap/pm/model";
import {
  GRAPH_PAPER_SQUARE_SIZE,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";
import { getWrappedBlockInfo } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetWrappedBlockInfo";
import {
  MIN_TEXT_WIDTH,
  getBlockPosInColumn,
  getNewspaperTextWidths,
  getTextMovedOut,
  isTextColumn,
  sumNodeSizes,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { getGapIndex } from "../DragUtils";
import { HOME_TARGET } from "../PageChange";

// The share of the page along each edge where a drop wraps the block to
// that side. Anywhere between makes it a newspaper
const PAGE_EDGE_FRACTION = 0.2;

// A newspaper's left text width moves in steps this big while dragging, so
// the preview isn't rebuilt on every pixel
const LEFT_TEXT_STEP = GRAPH_PAPER_SQUARE_SIZE;

// A block's own row with a new wrap, and the left text's width when it
// becomes a newspaper
export type OwnWrappedBlockMove = {
  wrap: Wrap;
  leftTextWidth: number | null;
};

/**
 * Builds what a block's own row turns into with a new wrap, for a drag or a
 * resize. Wrapping left or right keeps only the block, so a newspaper's left
 * text goes above it and its right text below it. Becoming a newspaper gives
 * it an empty text column on each side, the left one set to the given width
 * @param state The editor state
 * @param from Where the block starts
 * @param move The new wrap
 * @returns The page change, or null when the block isn't in a row
 */
export function buildOwnWrappedBlockMove(
  state: EditorState,
  from: number,
  move: OwnWrappedBlockMove,
): PageChange | null {
  const wrappedBlockInfo = getWrappedBlockInfo(state, from);
  if (!wrappedBlockInfo) return null;
  const wrappedBlockNode = state.doc.nodeAt(
    wrappedBlockInfo.wrappedBlockStart,
  )!;
  const blockColumn = state.doc.nodeAt(wrappedBlockInfo.columnStart)!;

  const { schema } = state;
  let above: TextLineNode[] = [];
  let below: TextLineNode[] = [];
  let columns: WrappedColumnNode[];

  if (move.wrap === "newspaper") {
    const [leftWidth, rightWidth] = getNewspaperTextWidths(
      blockColumn.firstChild!.attrs.width,
      move.leftTextWidth,
    );
    const emptyTextColumn = (width: number) =>
      schema.nodes.WrappedColumn.create(
        { columnType: "text", width },
        schema.nodes.paragraph.create(),
      );
    columns = [
      emptyTextColumn(leftWidth),
      blockColumn,
      emptyTextColumn(rightWidth),
    ];
  } else {
    ({ above, below } = getTextMovedOut(
      wrappedBlockInfo.textBefore?.node ?? null,
      wrappedBlockInfo.textAfter?.node ?? null,
    ));
    columns = [blockColumn];
  }

  const wrappedBlock = wrappedBlockNode.type.create(
    { ...wrappedBlockNode.attrs, wrap: move.wrap },
    Fragment.from(columns),
  );
  return {
    start: wrappedBlockInfo.wrappedBlockStart,
    end: wrappedBlockInfo.wrappedBlockEnd,
    nodes: [...above, wrappedBlock, ...below],
    blockOffset: getBlockPosInColumn(
      sumNodeSizes(above),
      columns,
      columns.indexOf(blockColumn),
    ),
    includesOriginal: true,
  };
}

/**
 * The block is alone in its own row. Near the page's left or right edge it
 * wraps to that side, and in between it becomes a newspaper, lined up with
 * where the block is held. The wrap it already has keeps it home
 * @param drag The drag
 * @param row The block's own row
 * @param cursor The cursor on the page
 * @returns The target, or home when it can't be a newspaper that wide
 */
export function moveAloneInOwnRow(
  drag: ActiveDrag,
  row: MeasuredRow,
  cursor: PagePoint,
): DropTarget {
  const { page } = drag;
  const edge = page.width * PAGE_EDGE_FRACTION;
  let wrap: Wrap = "newspaper";
  if (cursor.left < edge) wrap = "left";
  if (cursor.left > page.width - edge) wrap = "right";
  if (wrap === row.wrap) return HOME_TARGET;

  let leftTextWidth: number | null = null;
  if (wrap === "newspaper") {
    // both sides of text keep at least the smallest text width
    const blockWidth = drag.block.attrs.width as number;
    const widestLeftText = NOTEBOOK_PAGE_WIDTH - blockWidth - MIN_TEXT_WIDTH;
    if (widestLeftText < MIN_TEXT_WIDTH) return HOME_TARGET;

    const blockLeft = cursor.left - drag.grabOffsetX;
    const steppedLeft = Math.round(blockLeft / LEFT_TEXT_STEP) * LEFT_TEXT_STEP;
    leftTextWidth = Math.min(
      Math.max(steppedLeft, MIN_TEXT_WIDTH),
      widestLeftText,
    );
  }

  const change = buildOwnWrappedBlockMove(drag.startState, drag.startFrom, {
    wrap,
    leftTextWidth,
  });
  return change
    ? { name: `own ${wrap} ${leftTextWidth}`, change }
    : HOME_TARGET;
}

/**
 * The block's own row has other blocks too, so the block moves to the gap
 * between them the cursor is over. The row keeps its wrap and its text
 * @param drag The drag
 * @param row The block's own row
 * @param cursor The cursor on the page
 * @returns The target, home when that gap is where the block already is
 */
export function reorderOwnRow(
  drag: ActiveDrag,
  row: MeasuredRow,
  cursor: PagePoint,
): DropTarget {
  const draggedIndex = row.blocks.findIndex(
    (block) => block.pos === drag.startFrom,
  );
  const otherBlocks = row.blocks.filter(
    (block) => block.pos !== drag.startFrom,
  );
  const gapIndex = getGapIndex(otherBlocks, cursor.left);
  if (gapIndex === draggedIndex) return HOME_TARGET;

  // the block columns swap places, and text columns stay where they are
  const wrappedBlock = drag.startState.doc.nodeAt(row.start)!;
  const columns = wrappedBlock.content.content;
  const blockColumns = columns.filter((column) => !isTextColumn(column));
  const draggedColumn = blockColumns[draggedIndex];
  const reordered = blockColumns.filter((column) => column !== draggedColumn);
  reordered.splice(gapIndex, 0, draggedColumn);
  let nextBlockColumn = 0;
  const newColumns = columns.map((column) =>
    isTextColumn(column) ? column : reordered[nextBlockColumn++],
  );

  return {
    name: `reorder ${gapIndex}`,
    change: {
      start: row.start,
      end: row.end,
      nodes: [wrappedBlock.copy(Fragment.from(newColumns))],
      blockOffset: getBlockPosInColumn(
        0,
        newColumns,
        newColumns.indexOf(draggedColumn),
      ),
      includesOriginal: true,
    },
  };
}
