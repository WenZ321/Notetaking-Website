import type { EditorView } from "@tiptap/pm/view";
import type { Wrap } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import type { DropTarget } from "./FindDropTarget";
import type { DraggedBlock, ScreenPoint } from "./DragState";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetBlockSurroundings";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { buildHomeTarget } from "./DragState";

// The share of the page along each edge where a drop wraps the block to
// that side. Anywhere between makes it a newspaper
const PAGE_EDGE_FRACTION = 0.2;

/**
 * Where the block lands when it's dropped beside its own wrapped block, for
 * a wrapped block with just this one block. Dropping near the page's left or
 * right edge wraps it to that side, and dropping in between makes it a
 * newspaper, lined up with the ghost. Dropping where it already is puts it
 * back where it was
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block, where it sits and where it came from
 * @returns The target, or null when the point isn't beside the block's own
 * one-block wrapped block
 */
export function findOwnWrappedBlockTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: Pick<DraggedBlock, "from" | "width" | "home" | "grabOffsetX">,
): DropTarget | null {
  const surroundings = getBlockSurroundings(view.state, dragged.from);
  if (!surroundings || surroundings.blockCount !== 1) return null;

  const wrappedBlockDom = view.nodeDOM(surroundings.wrappedBlockStart);
  if (!(wrappedBlockDom instanceof HTMLElement)) return null;

  // The block is hidden while dragged, so the area counts the spot it came
  // from too, or it would shrink out from under the cursor
  const wrappedBlockRect = wrappedBlockDom.getBoundingClientRect();
  const homeTarget = buildHomeTarget(view, dragged.from, dragged.home);
  const top = Math.min(wrappedBlockRect.top, homeTarget.top);
  const bottom = Math.max(
    wrappedBlockRect.bottom,
    homeTarget.top + dragged.home.height,
  );
  if (point.top < top || point.top >= bottom) return null;

  // a floated wrapped block is only as wide as its block, so the zones are
  // measured across the whole page
  const pageRect = view.dom.getBoundingClientRect();
  const edge = pageRect.width * PAGE_EDGE_FRACTION;
  let wrap: Wrap = "newspaper";
  if (point.left < pageRect.left + edge) wrap = "left";
  if (point.left > pageRect.right - edge) wrap = "right";
  if (wrap === surroundings.wrap) return homeTarget;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = pageRect.width / NOTEBOOK_PAGE_WIDTH;

  if (wrap !== "newspaper") {
    return {
      pos: surroundings.wrappedBlockStart,
      left:
        wrap === "left"
          ? pageRect.left
          : pageRect.right - dragged.width * scale,
      top: wrappedBlockRect.top,
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
  const leftTextWidth = Math.round(
    Math.min(Math.max(ghostLeft, MIN_TEXT_WIDTH), widestLeftText),
  );
  return {
    pos: surroundings.wrappedBlockStart,
    left: pageRect.left + leftTextWidth * scale,
    top: wrappedBlockRect.top,
    isHome: false,
    ownWrappedBlockMove: { wrap, leftTextWidth },
    otherWrappedBlockDrop: null,
  };
}
