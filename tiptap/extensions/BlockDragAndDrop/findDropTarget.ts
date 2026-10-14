import type { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { ScreenPoint } from "./dragState";
import type { DraggedBlock } from "./predictBlockSpot";
import type { OtherRowDrop } from "./OtherRowDrop/buildOtherRowDrop";
import { dropPoint } from "@tiptap/pm/transform";
import { predictBlockSpot } from "./predictBlockSpot";

// Where in its own row a block moves: to a side, or to the middle with the
// left text set to a width
export type RowMove = {
  side: "left" | "right" | "middle";
  leftTextWidth: number | null; // the left text's width when the block moves to the middle
};

// A drop into another row: which row, where among its blocks the dragged
// one goes, and what the row turns into, worked out once and saved
export type RowDrop = {
  rowStart: number;
  insertIndex: number;
  result: OtherRowDrop;
};

// Where a dragged block will land. The drag saves it, and both the preview
// and the drop read that saved one, so the block lands where the preview showed
export type DropTarget = {
  pos: number; // where the block goes, in the page before the original is removed
  left: number; // the block's left edge in the window once the row rules arrange it, for the preview
  top: number; // the block's top edge in the window, for the preview
  isHome: boolean; // true when the block goes back to where it started, so nothing moves
  rowMove: RowMove | null; // set when the block moves within its own row
  rowDrop: RowDrop | null; // set when the block drops into another row
};

/**
 * Decides where a dragged block lands, for now the spot in the document
 * the editor finds under the point
 * @param view The editor
 * @param point Where to look, in the window
 * @param slice What's being dragged
 * @param dragged The dragged block and where it sits now
 * @returns The target, or null when there's no place to drop
 */
export function findDropTarget(
  view: EditorView,
  point: ScreenPoint,
  slice: Slice,
  dragged: DraggedBlock,
): DropTarget | null {
  const found = view.posAtCoords(point);
  if (!found) return null;

  const pos = dropPoint(view.state.doc, found.pos, slice) ?? found.pos;
  return {
    pos,
    ...predictBlockSpot(view, pos, dragged),
    isHome: false,
    rowMove: null,
    rowDrop: null,
  };
}
