import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget, RowMove } from "./findDropTarget";
import type { HomeArea, ScreenPoint } from "./dragState";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { getBlockRow } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/getBlockRow";
import {
  MIN_TEXT_WIDTH,
  joinText,
} from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { blockDragPluginKey, getHomeTarget } from "./dragState";

// The share of the row along each edge where a drop moves a block in the
// middle of its row to that side
const ROW_EDGE_FRACTION = 0.2;

type OwnRowBlock = {
  from: number;
  width: number;
  home: HomeArea;
  grabOffsetX: number;
};

/**
 * Where the block lands when it's dropped in its own row, for a row with
 * just this one block. A block in the middle moves to a side when dropped
 * near that edge. A block on a side moves to the middle when dropped away
 * from its side, or to the other side when dropped near that edge. Anywhere
 * else puts it back where it was
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block, where it sits and where it came from
 * @returns The target, or null when the point isn't over the block's own
 * one-block row
 */
export function findOwnRowTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: OwnRowBlock,
): DropTarget | null {
  const row = getBlockRow(view.state, dragged.from);
  if (!row || row.blockCount !== 1) return null;

  const rowDom = view.nodeDOM(row.rowStart);
  if (!(rowDom instanceof HTMLElement)) return null;

  // The block is hidden while dragged, so the row counts the spot it came
  // from too, or the row would shrink out from under the cursor
  const rowRect = rowDom.getBoundingClientRect();
  const homeTarget = getHomeTarget(view, dragged.from, dragged.home);
  const top = Math.min(rowRect.top, homeTarget.top);
  const bottom = Math.max(rowRect.bottom, homeTarget.top + dragged.home.height);
  if (point.top < top || point.top >= bottom) return null;

  const edge = rowRect.width * ROW_EDGE_FRACTION;
  let zone: RowMove["side"] = "middle";
  if (point.left < rowRect.left + edge) zone = "left";
  if (point.left > rowRect.right - edge) zone = "right";

  const isOnLeft = !row.textBefore;
  const isOnRight = !row.textAfter;
  const isAlreadyThere =
    (zone === "left" && isOnLeft) ||
    (zone === "right" && isOnRight) ||
    (zone === "middle" && !isOnLeft && !isOnRight);
  if (isAlreadyThere) return homeTarget;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = rowRect.width / NOTEBOOK_PAGE_WIDTH;

  if (zone !== "middle") {
    return {
      pos: row.rowStart,
      left:
        zone === "left" ? rowRect.left : rowRect.right - dragged.width * scale,
      top: rowRect.top,
      isHome: false,
      rowMove: { side: zone, leftTextWidth: null },
    };
  }

  // In the middle the block lines up with the ghost, keeping both sides of
  // text at least the smallest text width. Too wide a block can't fit there
  const widestLeftText = NOTEBOOK_PAGE_WIDTH - dragged.width - MIN_TEXT_WIDTH;
  if (widestLeftText < MIN_TEXT_WIDTH) return homeTarget;

  const ghostLeft = (point.left - dragged.grabOffsetX - rowRect.left) / scale;
  const leftTextWidth = Math.round(
    Math.min(Math.max(ghostLeft, MIN_TEXT_WIDTH), widestLeftText),
  );
  return {
    pos: row.rowStart,
    left: rowRect.left + leftTextWidth * scale,
    top: rowRect.top,
    isHome: false,
    rowMove: { side: "middle", leftTextWidth },
  };
}

/**
 * Moves the dragged block within its own row and selects it. At a side, the
 * row's text joins into one column on the other side, left text first. In
 * the middle, the text stays where it is and an empty text column opens on
 * the other side
 * @param view The editor
 * @param move Where in the row the block goes
 */
export function moveWithinOwnRow(view: EditorView, move: RowMove) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const row = drag && getBlockRow(state, drag.from);
  const rowNode = row && state.doc.nodeAt(row.rowStart);
  const blockColumn = row && state.doc.nodeAt(row.columnStart);
  if (!row || !rowNode || !blockColumn) return;

  const createTextColumn = (text: Fragment, width: number | null = null) =>
    state.schema.nodes.WrappedColumn.create(
      { columnType: "text", width },
      text.size ? text : state.schema.nodes.paragraph.create(),
    );

  let columns;
  if (move.side === "middle") {
    const text =
      (row.textBefore ?? row.textAfter)?.node.content ?? Fragment.empty;
    const [leftText, rightText] = row.textBefore
      ? [text, Fragment.empty]
      : [Fragment.empty, text];
    columns = [
      createTextColumn(leftText, move.leftTextWidth),
      blockColumn,
      createTextColumn(rightText),
    ];
  } else {
    const textColumn = createTextColumn(
      joinText(
        row.textBefore?.node.content ?? Fragment.empty,
        row.textAfter?.node.content ?? Fragment.empty,
      ),
    );
    columns =
      move.side === "left"
        ? [blockColumn, textColumn]
        : [textColumn, blockColumn];
  }

  // the block sits just inside its column, after the columns before it
  const blockIndex = columns.indexOf(blockColumn);
  const blockPos =
    row.rowStart +
    1 +
    columns.slice(0, blockIndex).reduce((sum, c) => sum + c.nodeSize, 0) +
    1;

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(
      row.rowStart,
      row.rowEnd,
      rowNode.copy(Fragment.from(columns)),
    );
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);
}
