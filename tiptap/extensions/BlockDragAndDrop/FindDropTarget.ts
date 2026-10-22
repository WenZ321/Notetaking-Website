import type { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import type { DraggedBlock, ScreenPoint } from "./DragState";
import type { WrappedBlockDropOutcome } from "./WrappedBlockDropLogic/BuildWrappedBlockDrop";
import { dropPoint } from "@tiptap/pm/transform";
import { buildHomeTarget } from "./DragState";

// How a block's own wrapped block changes when it's moved within it: wrapped
// to a side, or a newspaper with the left text set to a width
export type OwnWrappedBlockMove = {
  wrap: Wrap;
  leftTextWidth: number | null; // the left text's width when the block becomes a newspaper
};

// A drop into another wrapped block: which wrapped block, where among its blocks the dragged
// one goes, and what the wrapped block turns into, worked out once and saved
export type OtherWrappedBlockDrop = {
  wrappedBlockStart: number;
  insertIndex: number;
  outcome: WrappedBlockDropOutcome;
};

// Where a dragged block will land. The drag saves it, and both the preview
// and the drop read that saved one, so the block lands where the preview showed
export type DropTarget = {
  pos: number; // where the block goes, in the page before the original is removed
  isHome: boolean; // true when the block goes back to where it started, so nothing moves
  ownWrappedBlockMove: OwnWrappedBlockMove | null; // set when the block moves within its own wrapped block
  otherWrappedBlockDrop: OtherWrappedBlockDrop | null; // set when the block drops into another wrapped block
};

/**
 * Decides where a dragged block lands, for now the spot in the document
 * the editor finds under the point
 * @param view The editor
 * @param point Where to look, in the window
 * @param slice What's being dragged
 * @param dragged Where the dragged block sits now
 * @returns The target, the block's home when the spot is right where it
 * already is, or null when there's no place to drop
 */
export function findDropTarget(
  view: EditorView,
  point: ScreenPoint,
  slice: Slice,
  dragged: Pick<DraggedBlock, "from" | "to">,
): DropTarget | null {
  const found = view.posAtCoords(point);
  if (!found) return null;

  const pos = dropPoint(view.state.doc, found.pos, slice) ?? found.pos;

  // a spot right before or after the block puts it back where it was
  if (pos >= dragged.from && pos <= dragged.to) {
    return buildHomeTarget(dragged.from);
  }
  return {
    pos,
    isHome: false,
    ownWrappedBlockMove: null,
    otherWrappedBlockDrop: null,
  };
}
