import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget, OwnWrappedBlockMove } from "./findDropTarget";
import type { DraggedBlock, ScreenPoint } from "./dragState";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/getBlockSurroundings";
import { MIN_TEXT_WIDTH } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { buildHomeTarget } from "./dragState";

// The share of the wrapped block along each edge where a drop moves a block in the
// middle of its wrapped block to that side
const WRAPPED_BLOCK_EDGE_FRACTION = 0.2;

/**
 * Where the block lands when it's dropped in its own wrapped block, for a wrapped block with
 * just this one block. A block in the middle moves to a side when dropped
 * near that edge. A block on a side moves to the middle when dropped away
 * from its side, or to the other side when dropped near that edge. Anywhere
 * else puts it back where it was
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block, where it sits and where it came from
 * @returns The target, or null when the point isn't over the block's own
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

  // The block is hidden while dragged, so the wrapped block counts the spot it came
  // from too, or the wrapped block would shrink out from under the cursor
  const wrappedBlockRect = wrappedBlockDom.getBoundingClientRect();
  const homeTarget = buildHomeTarget(view, dragged.from, dragged.home);
  const top = Math.min(wrappedBlockRect.top, homeTarget.top);
  const bottom = Math.max(
    wrappedBlockRect.bottom,
    homeTarget.top + dragged.home.height,
  );
  if (point.top < top || point.top >= bottom) return null;

  const edge = wrappedBlockRect.width * WRAPPED_BLOCK_EDGE_FRACTION;
  let zone: OwnWrappedBlockMove["side"] = "middle";
  if (point.left < wrappedBlockRect.left + edge) zone = "left";
  if (point.left > wrappedBlockRect.right - edge) zone = "right";

  const isOnLeft = !surroundings.textBefore;
  const isOnRight = !surroundings.textAfter;
  const isAlreadyThere =
    (zone === "left" && isOnLeft) ||
    (zone === "right" && isOnRight) ||
    (zone === "middle" && !isOnLeft && !isOnRight);
  if (isAlreadyThere) return homeTarget;

  // window sizes include any page scaling, so page widths are scaled too
  const scale = wrappedBlockRect.width / NOTEBOOK_PAGE_WIDTH;

  if (zone !== "middle") {
    return {
      pos: surroundings.wrappedBlockStart,
      left:
        zone === "left"
          ? wrappedBlockRect.left
          : wrappedBlockRect.right - dragged.width * scale,
      top: wrappedBlockRect.top,
      isHome: false,
      ownWrappedBlockMove: { side: zone, leftTextWidth: null },
      otherWrappedBlockDrop: null,
    };
  }

  // In the middle the block lines up with the ghost, keeping both sides of
  // text at least the smallest text width. Too wide a block can't fit there
  const widestLeftText = NOTEBOOK_PAGE_WIDTH - dragged.width - MIN_TEXT_WIDTH;
  if (widestLeftText < MIN_TEXT_WIDTH) return homeTarget;

  const ghostLeft =
    (point.left - dragged.grabOffsetX - wrappedBlockRect.left) / scale;
  const leftTextWidth = Math.round(
    Math.min(Math.max(ghostLeft, MIN_TEXT_WIDTH), widestLeftText),
  );
  return {
    pos: surroundings.wrappedBlockStart,
    left: wrappedBlockRect.left + leftTextWidth * scale,
    top: wrappedBlockRect.top,
    isHome: false,
    ownWrappedBlockMove: { side: "middle", leftTextWidth },
    otherWrappedBlockDrop: null,
  };
}
