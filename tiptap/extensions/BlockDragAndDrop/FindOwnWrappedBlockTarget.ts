import type { EditorView } from "@tiptap/pm/view";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import type { DropTarget } from "./FindDropTarget";
import type { DraggedBlock, ScreenPoint } from "./DragState";
import {
  GRAPH_PAPER_SQUARE_SIZE,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetBlockSurroundings";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { buildHomeTarget } from "./DragState";

// The share of the page along each edge where a drop wraps the block to
// that side. Anywhere between makes it a newspaper
const PAGE_EDGE_FRACTION = 0.2;

// A newspaper's left text width moves in steps this big while dragging, so
// the preview isn't rebuilt on every pixel
const LEFT_TEXT_STEP = GRAPH_PAPER_SQUARE_SIZE;

// The dragged block's own wrapped block, measured once the block is hidden
// at the start of the drag, so a preview on the page doesn't move it.
// Measured from the editor's top left corner, like the block's home
export type MeasuredOwnWrappedBlock = {
  wrappedBlockStart: number;
  wrap: Wrap;
  blockCount: number;
  top: number;
  bottom: number;
};

/**
 * Measures the dragged block's own wrapped block
 * @param view The editor
 * @param from Where the dragged block starts
 * @returns The measured wrapped block, or null when the block isn't in one
 */
export function measureOwnWrappedBlock(
  view: EditorView,
  from: number,
): MeasuredOwnWrappedBlock | null {
  const surroundings = getBlockSurroundings(view.state, from);
  const wrappedBlockDom =
    surroundings && view.nodeDOM(surroundings.wrappedBlockStart);
  if (!surroundings || !(wrappedBlockDom instanceof HTMLElement)) return null;

  const editorRect = view.dom.getBoundingClientRect();
  const wrappedBlockRect = wrappedBlockDom.getBoundingClientRect();
  return {
    wrappedBlockStart: surroundings.wrappedBlockStart,
    wrap: surroundings.wrap,
    blockCount: surroundings.blockCount,
    top: wrappedBlockRect.top - editorRect.top,
    bottom: wrappedBlockRect.bottom - editorRect.top,
  };
}

/**
 * Where the block lands when it's dropped beside its own wrapped block, for
 * a wrapped block with just this one block. Dropping near the page's left or
 * right edge wraps it to that side, and dropping in between makes it a
 * newspaper, lined up with the ghost. Dropping where it already is puts it
 * back where it was
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block and where it came from
 * @param from Where the block starts in the page before any preview
 * @param own The block's own wrapped block, measured at the start of the drag
 * @returns The target, or null when the point isn't beside the block's own
 * one-block wrapped block
 */
export function findOwnWrappedBlockTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: Pick<DraggedBlock, "width" | "home" | "grabOffsetX">,
  from: number,
  own: MeasuredOwnWrappedBlock | null,
): DropTarget | null {
  if (!own || own.blockCount !== 1) return null;

  // The block is hidden while dragged, so the area counts the spot it came
  // from too, or it would shrink out from under the cursor
  const pageRect = view.dom.getBoundingClientRect();
  const homeTarget = buildHomeTarget(view, from, dragged.home);
  const wrappedBlockTop = pageRect.top + own.top;
  const top = Math.min(wrappedBlockTop, homeTarget.top);
  const bottom = Math.max(
    pageRect.top + own.bottom,
    homeTarget.top + dragged.home.height,
  );
  if (point.top < top || point.top >= bottom) return null;

  // a floated wrapped block is only as wide as its block, so the zones are
  // measured across the whole page
  const edge = pageRect.width * PAGE_EDGE_FRACTION;
  let wrap: Wrap = "newspaper";
  if (point.left < pageRect.left + edge) wrap = "left";
  if (point.left > pageRect.right - edge) wrap = "right";
  if (wrap === own.wrap) return homeTarget;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = pageRect.width / NOTEBOOK_PAGE_WIDTH;

  if (wrap !== "newspaper") {
    return {
      pos: own.wrappedBlockStart,
      left:
        wrap === "left"
          ? pageRect.left
          : pageRect.right - dragged.width * scale,
      top: wrappedBlockTop,
      isHome: false,
      ownWrappedBlockMove: { wrap, leftTextWidth: null },
      otherWrappedBlockDrop: null,
    };
  }

  // In a newspaper the block lines up with the ghost, keeping both sides of
  // text at least the smallest text width. Too wide a block can't fit there
  const widestLeftText = NOTEBOOK_PAGE_WIDTH - dragged.width - MIN_TEXT_WIDTH;
  if (widestLeftText < MIN_TEXT_WIDTH) return homeTarget;

  const ghostLeft = (point.left - dragged.grabOffsetX - pageRect.left) / scale;
  const steppedLeft = Math.round(ghostLeft / LEFT_TEXT_STEP) * LEFT_TEXT_STEP;
  const leftTextWidth = Math.min(
    Math.max(steppedLeft, MIN_TEXT_WIDTH),
    widestLeftText,
  );
  return {
    pos: own.wrappedBlockStart,
    left: pageRect.left + leftTextWidth * scale,
    top: wrappedBlockTop,
    isHome: false,
    ownWrappedBlockMove: { wrap, leftTextWidth },
    otherWrappedBlockDrop: null,
  };
}
