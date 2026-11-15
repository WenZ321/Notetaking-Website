import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { EditorView } from "@tiptap/pm/view";
import type { DragOrigin } from "./DragState";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import type { MinBlockSize } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { getPageScale } from "@/tiptap/PageScale";
import {
  getBlockPosInColumn,
  getRowDom,
  isTextColumn,
  readContentMinSize,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

// A spot on the page, measured from the editor's top left corner
export type PagePoint = {
  left: number;
  top: number;
};

// One block in a measured row
export type MeasuredBlock = {
  pos: number;
  left: number;
  right: number;
  minSize: MinBlockSize; // the smallest size its content allows
};

// A row of blocks on the page, and whether it's the dragged block's own row
export type MeasuredRow = {
  start: number;
  end: number;
  wrap: Wrap;
  isOwn: boolean;
  top: number;
  bottom: number;
  blocks: MeasuredBlock[]; // left to right
};

// A line of text on the page, or any other top level node that isn't a row
export type MeasuredLine = {
  start: number;
  end: number;
  top: number;
  bottom: number;
};

// The page measured once when the drag starts. A preview moves things
// around under the cursor, so every drop rule reads these instead
export type MeasuredPage = {
  width: number;
  rows: MeasuredRow[]; // top to bottom
  lines: MeasuredLine[]; // top to bottom
};

// Where each block in the dragged block's row is on screen, by its place
function readOwnRowRects(
  view: EditorView,
  origin: DragOrigin,
): Map<number, DOMRect> {
  const rects = new Map<number, DOMRect>();
  if (origin.kind !== "page") return rects;

  const $block = view.state.doc.resolve(origin.from);
  const rowStart = $block.before(1);
  const columns = $block.node(1).content.content;
  columns.forEach((column, index) => {
    if (isTextColumn(column)) return;
    const pos = getBlockPosInColumn(rowStart, columns, index);
    const blockDom = view.nodeDOM(pos);
    if (blockDom instanceof HTMLElement) {
      rects.set(pos, blockDom.getBoundingClientRect());
    }
  });
  return rects;
}

/**
 * Measures every row and line on the page
 * @param view The editor
 * @param origin Where the dragged block comes from
 * @param isDraggedHidden Whether to measure with the dragged block hidden
 * @returns The measured page
 */
export function measurePage(
  view: EditorView,
  origin: DragOrigin,
  isDraggedHidden: boolean,
): MeasuredPage {
  // measured on screen, kept in the page's own pixels
  const editorRect = view.dom.getBoundingClientRect();
  const scale = getPageScale(view);
  const page: MeasuredPage = {
    width: editorRect.width / scale,
    rows: [],
    lines: [],
  };

  // measured with the dragged block hidden, the way the page looks while
  // it's dragged, so a spot on screen is the same spot here. Its own row's
  // blocks are read across while it shows, since the others slide into its
  // gap once it hides, and a small move would reorder them
  const dom =
    isDraggedHidden && origin.kind === "page"
      ? view.nodeDOM(origin.from)
      : null;
  const draggedDom = dom instanceof HTMLElement ? dom : null;
  const ownRowRects = draggedDom
    ? readOwnRowRects(view, origin)
    : new Map<number, DOMRect>();
  draggedDom?.classList.add("block-drag-source");

  view.state.doc.forEach((node, start) => {
    const isRow = node.type.name === "WrappedBlock";
    const dom = isRow ? getRowDom(view, start) : view.nodeDOM(start);
    if (!(dom instanceof HTMLElement)) return;
    const rect = dom.getBoundingClientRect();
    const end = start + node.nodeSize;
    const top = (rect.top - editorRect.top) / scale;
    const bottom = (rect.bottom - editorRect.top) / scale;

    if (!isRow) {
      page.lines.push({ start, end, top, bottom });
      return;
    }

    const blocks: MeasuredBlock[] = [];
    const columns = node.content.content;
    columns.forEach((column, index) => {
      if (isTextColumn(column)) return;
      const pos = getBlockPosInColumn(start, columns, index);
      const blockDom = view.nodeDOM(pos);
      if (!(blockDom instanceof HTMLElement)) return;

      const blockRect =
        ownRowRects.get(pos) ?? blockDom.getBoundingClientRect();
      blocks.push({
        pos,
        left: (blockRect.left - editorRect.left) / scale,
        right: (blockRect.right - editorRect.left) / scale,
        minSize: readContentMinSize(view, pos),
      });
    });
    page.rows.push({
      start,
      end,
      wrap: node.attrs.wrap,
      isOwn: origin.kind === "page" && origin.from > start && origin.from < end,
      top,
      bottom,
      blocks,
    });
  });

  draggedDom?.classList.remove("block-drag-source");
  return page;
}

// The row the cursor is at the height of, if any
export function findRowAt(
  page: MeasuredPage,
  top: number,
): MeasuredRow | undefined {
  return page.rows.find((row) => top >= row.top && top < row.bottom);
}

// The line the cursor is over, or the next one down when it's in a gap
// between lines, or the last one when it's below them all
export function findLineAt(
  page: MeasuredPage,
  top: number,
): MeasuredLine | undefined {
  return page.lines.find((line) => top < line.bottom) ?? page.lines.at(-1);
}

// Which gap between the blocks the cursor is over, 0 [block] 1 [block] 2.
// Each block's middle splits the gaps on either side of it
export function getGapIndex(blocks: MeasuredBlock[], left: number): number {
  return blocks.filter((block) => left >= (block.left + block.right) / 2)
    .length;
}

/**
 * The stretch of page that goes away when a dragged block leaves its spot:
 * its whole column, so no empty column is left behind, or its whole row when
 * that column was all it had
 * @param doc The page
 * @param from Where the block starts
 * @returns Where the stretch starts and ends
 */
export function getLeavingRange(
  doc: PageNode,
  from: number,
): { from: number; to: number } {
  const $block = doc.resolve(from);
  const columnDepth = $block.depth;
  const wrappedBlockDepth = columnDepth - 1;
  const leavingDepth =
    $block.node(wrappedBlockDepth).childCount === 1
      ? wrappedBlockDepth
      : columnDepth;
  return { from: $block.before(leavingDepth), to: $block.after(leavingDepth) };
}
