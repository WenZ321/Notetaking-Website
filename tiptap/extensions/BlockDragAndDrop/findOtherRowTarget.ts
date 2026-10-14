import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "./findDropTarget";
import type { ScreenPoint } from "./dragState";
import type { MeasuredColumn, MeasuredRow } from "./measureOtherRows";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

// How wide the strip along a block's page edge is, in a row with text on
// only one side. Dropping there puts the dragged block on that edge
const EDGE_STRIP_WIDTH = 16;

type OtherRowBlock = {
  width: number;
  otherRows: MeasuredRow[];
};

type OneBlockRow = {
  block: MeasuredColumn;
  hasTextBefore: boolean;
  hasTextAfter: boolean;
};

// The row's one block and whether text sits before or after it, or null
// when the row doesn't have exactly one block
function readOneBlockRow(row: MeasuredRow): OneBlockRow | null {
  const blocks = row.columns.filter(
    (column) => column.columnType === "block",
  );
  if (blocks.length !== 1) return null;

  const block = blocks[0];
  const index = row.columns.indexOf(block);
  return {
    block,
    hasTextBefore: index > 0,
    hasTextAfter: index < row.columns.length - 1,
  };
}

// Which side of the row's block the point is on. With text on both sides
// the block's center splits them. With text on one side, only the strip
// along the block's page edge counts as that edge's side
function getSide(
  { block, hasTextBefore, hasTextAfter }: OneBlockRow,
  left: number,
  strip: number,
) {
  const center = (block.left + block.right) / 2;
  if (hasTextBefore && hasTextAfter) return left < center ? "left" : "right";
  if (hasTextAfter) return left < block.left + strip ? "left" : "right";
  if (hasTextBefore) return left >= block.right - strip ? "right" : "left";
  return left < center ? "left" : "right";
}

// Where the dragged block's left edge goes, from the editor's left edge.
// For now it ignores any resizing, which the drop rules add later
function getBlockLeft(
  row: MeasuredRow,
  { block, hasTextBefore, hasTextAfter }: OneBlockRow,
  side: "left" | "right",
  width: number,
) {
  let left;
  if (hasTextBefore && !hasTextAfter) {
    left = side === "left" ? block.left - width : row.right - width;
  } else if (hasTextAfter && !hasTextBefore) {
    left = side === "left" ? row.left : block.right;
  } else {
    left = side === "left" ? row.left : row.right - width;
  }
  return Math.min(Math.max(left, row.left), row.right - width);
}

/**
 * Where the block lands when it's dropped into another row that has one
 * block, on the left or right of that block
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block's width and the rows measured at drag start
 * @returns The target, or null when the point isn't over a one-block row
 */
export function findOtherRowTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: OtherRowBlock,
): DropTarget | null {
  const editorRect = view.dom.getBoundingClientRect();
  const top = point.top - editorRect.top;
  const left = point.left - editorRect.left;

  const row = dragged.otherRows.find(
    (otherRow) => top >= otherRow.top && top < otherRow.bottom,
  );
  const oneBlockRow = row && readOneBlockRow(row);
  if (!row || !oneBlockRow) return null;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = (row.right - row.left) / NOTEBOOK_PAGE_WIDTH;
  const side = getSide(oneBlockRow, left, EDGE_STRIP_WIDTH * scale);
  const { block } = oneBlockRow;

  return {
    pos: side === "left" ? block.pos : block.end,
    left:
      editorRect.left +
      getBlockLeft(row, oneBlockRow, side, dragged.width * scale),
    top: editorRect.top + row.top,
    isHome: false,
    rowMove: null,
  };
}
