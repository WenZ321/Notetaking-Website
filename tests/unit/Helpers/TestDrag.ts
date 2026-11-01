import type {
  CustomBlockNode,
  PageNode,
  TopLevelNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { ActiveDrag } from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import type {
  MeasuredBlock,
  MeasuredLine,
  MeasuredPage,
  MeasuredRow,
} from "@/tiptap/extensions/BlockDragAndDrop/DragUtils";
import type { PageChange } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import { EditorState } from "@tiptap/pm/state";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { applyDrop } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import { schema } from "./TestPage";

// Content that needs no room, so only the block's own smallest size counts
export const NO_CONTENT_MIN = { width: 0, height: 0 };

// How tall rows and lines are drawn, stacked one under the other
const ROW_HEIGHT = 100;
const LINE_HEIGHT = 20;

// A page holding these rows and lines, as the editor holds it
export function makeState(nodes: TopLevelNode[]): EditorState {
  return EditorState.create({ doc: schema.nodes.doc.create(null, nodes) });
}

// Where each custom block on the page starts, top to bottom, left to right
export function getBlockPositions(doc: PageNode): number[] {
  const positions: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "TestBlock") positions.push(pos);
  });
  return positions;
}

// The page as a drag measures it on screen, with each block as wide as its
// width. Rows are ROW_HEIGHT tall and lines LINE_HEIGHT, from the top down
function measurePage(state: EditorState, draggedFrom: number): MeasuredPage {
  const rows: MeasuredRow[] = [];
  const lines: MeasuredLine[] = [];
  let top = 0;

  state.doc.forEach((node, start) => {
    const end = start + node.nodeSize;
    if (node.type.name !== "WrappedBlock") {
      lines.push({ start, end, top, bottom: top + LINE_HEIGHT });
      top += LINE_HEIGHT;
      return;
    }

    const blocks: MeasuredBlock[] = [];
    let left = 0;
    node.descendants((child, offset) => {
      if (child.type.name !== "TestBlock") return;
      const right = left + child.attrs.width;
      blocks.push({
        pos: start + 1 + offset,
        left,
        right,
        minSize: NO_CONTENT_MIN,
      });
      left = right;
    });

    const isOwn = blocks.some((block) => block.pos === draggedFrom);
    rows.push({
      start,
      end,
      wrap: node.attrs.wrap,
      isOwn,
      top,
      bottom: top + ROW_HEIGHT,
      blocks,
    });
    top += ROW_HEIGHT;
  });

  return { width: NOTEBOOK_PAGE_WIDTH, rows, lines };
}

// A drag of the block starting at from
export function makeDrag(state: EditorState, from: number): ActiveDrag {
  return {
    startState: state,
    startFrom: from,
    from,
    block: state.doc.nodeAt(from) as CustomBlockNode,
    blockMinSize: NO_CONTENT_MIN,
    grabOffsetX: 0,
    page: measurePage(state, from),
    target: null,
    preview: null,
  };
}

// Drops the block the way the editor does, returning the new page and the
// block where the drop says the dragged one landed
export function drop(drag: ActiveDrag, change: PageChange) {
  const tr = drag.startState.tr;
  const blockPos = applyDrop(tr, drag.startFrom, change);
  return { doc: tr.doc, droppedBlock: tr.doc.nodeAt(blockPos)! };
}

// What each row and line on the page is, top to bottom: "row" for a row,
// or a line's text
export function describePage(doc: PageNode): string[] {
  return doc.content.content.map((node) =>
    node.type.name === "WrappedBlock" ? "row" : node.textContent,
  );
}
