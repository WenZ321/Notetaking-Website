import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { SnapLength } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { DropTarget } from "../findDropTarget";
import type { HomeArea, ScreenPoint } from "../dragState";
import type { MeasuredColumn, MeasuredRow } from "../measureOtherRows";
import type { MinBlockSize } from "../readContentMinSize";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { getHomeTarget } from "../dragState";
import { buildOtherRowDrop } from "./buildOtherRowDrop";

// How wide the strip along a block's page edge is, in a row with text on
// only one side. Dropping there puts the dragged block on that edge
const EDGE_STRIP_WIDTH = 16;

type OtherRowBlock = {
  from: number;
  node: ProseMirrorNode;
  home: HomeArea;
  draggedMinSize: MinBlockSize;
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

/**
 * Where the block lands when it's dropped into another row that has one
 * block, on the left or right of that block. The row it turns into is
 * built now and saved, so the drop makes exactly what the preview showed
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block and the rows measured at drag start
 * @param snapLength How the page's paper fits block sizes
 * @returns The target, the block's home when it can't fit there, or null
 * when the point isn't over a one-block row
 */
export function findOtherRowTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: OtherRowBlock,
  snapLength: SnapLength,
): DropTarget | null {
  const editorRect = view.dom.getBoundingClientRect();
  const top = point.top - editorRect.top;
  const left = point.left - editorRect.left;

  const row = dragged.otherRows.find(
    (otherRow) => top >= otherRow.top && top < otherRow.bottom,
  );
  const oneBlockRow = row && readOneBlockRow(row);
  const rowNode = row && view.state.doc.nodeAt(row.rowStart);
  if (!row || !oneBlockRow || !rowNode) return null;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = (row.right - row.left) / NOTEBOOK_PAGE_WIDTH;
  const side = getSide(oneBlockRow, left, EDGE_STRIP_WIDTH * scale);
  const insertIndex = side === "left" ? 0 : 1;

  const result = buildOtherRowDrop({
    rowNode,
    insertIndex,
    dragged: dragged.node,
    draggedMinSize: dragged.draggedMinSize,
    rowBlockMinSizes: [oneBlockRow.block.minSize ?? { width: 0, height: 0 }],
    snapLength,
  });
  if (!result) return getHomeTarget(view, dragged.from, dragged.home);

  // the dragged block starts after the columns before it
  const offset = result.row.content.content
    .slice(0, result.draggedColumnIndex)
    .reduce((sum, column) => sum + getColumnWidth(column), 0);

  const { block } = oneBlockRow;
  return {
    pos: side === "left" ? block.pos : block.end,
    left: editorRect.left + row.left + offset * scale,
    top: editorRect.top + row.top,
    isHome: false,
    rowMove: null,
    rowDrop: { rowStart: row.rowStart, insertIndex, result },
  };
}
