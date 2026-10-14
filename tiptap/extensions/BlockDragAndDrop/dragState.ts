import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "./findDropTarget";
import type { MeasuredRow } from "./measureOtherRows";
import { NodeSelection, PluginKey } from "@tiptap/pm/state";

// The area the block covered before the drag, measured from the editor's
// top left corner so scrolling during the drag doesn't throw it off
export type HomeArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// A point in the window, like the cursor
export type ScreenPoint = {
  left: number;
  top: number;
};

// While a block is dragged: where it sits in the page, the area it came
// from, how far from its top left corner it was grabbed, the rows it can
// drop into, and where it will land.
// The preview draws this target and the drop uses it, so they always agree
export type DragState = {
  from: number;
  to: number;
  home: HomeArea;
  grabOffsetX: number;
  grabOffsetY: number;
  otherRows: MeasuredRow[];
  target: DropTarget | null;
} | null;

export const blockDragPluginKey = new PluginKey<DragState>("blockDragAndDrop");

// The custom block being dragged, where it sits and where it will land, or
// null when nothing or something else is dragged, like text
export function getDraggedBlock(state: EditorState) {
  const drag = blockDragPluginKey.getState(state);
  const node = drag && state.doc.nodeAt(drag.from);
  if (!drag || !node) return null;

  const { width, height } = node.attrs;
  if (typeof width !== "number" || typeof height !== "number") return null;

  return { ...drag, node, width, height };
}

// Saves a new drag state, without adding a step to undo
export function setDragState(view: EditorView, drag: DragState) {
  view.dispatch(
    view.state.tr
      .setMeta(blockDragPluginKey, drag)
      .setMeta("addToHistory", false),
  );
}

// Clears the drag, which shows the original again
export function endDrag(view: EditorView) {
  if (blockDragPluginKey.getState(view.state)) setDragState(view, null);
}

// Measures the block's area before it's hidden, from the editor's corner
export function measureHome(view: EditorView, from: number): HomeArea | null {
  const blockDom = view.nodeDOM(from);
  if (!(blockDom instanceof HTMLElement)) return null;

  const blockRect = blockDom.getBoundingClientRect();
  const editorRect = view.dom.getBoundingClientRect();

  return {
    left: blockRect.left - editorRect.left,
    top: blockRect.top - editorRect.top,
    width: blockRect.width,
    height: blockRect.height,
  };
}

// How much of the block's old area, centered in it, sends the block home.
// Smaller than the whole block so the content that moved in stays reachable
const HOME_AREA_FRACTION = 0.5;

// The target that puts the block back where it started
export function getHomeTarget(
  view: EditorView,
  from: number,
  home: HomeArea,
): DropTarget {
  const editorRect = view.dom.getBoundingClientRect();
  return {
    pos: from,
    left: editorRect.left + home.left,
    top: editorRect.top + home.top,
    isHome: true,
    rowMove: null,
  };
}

// The target for going back home when the point is near the middle of the
// block's old area, which takes priority over whatever moved into that space
export function findHomeTarget(
  view: EditorView,
  point: ScreenPoint,
  from: number,
  home: HomeArea,
): DropTarget | null {
  const homeTarget = getHomeTarget(view, from, home);
  const { left, top } = homeTarget;

  // the centered part of the old area that counts as home
  const marginX = (home.width * (1 - HOME_AREA_FRACTION)) / 2;
  const marginY = (home.height * (1 - HOME_AREA_FRACTION)) / 2;

  const isOverHome =
    point.left >= left + marginX &&
    point.left <= left + home.width - marginX &&
    point.top >= top + marginY &&
    point.top <= top + home.height - marginY;

  return isOverHome ? homeTarget : null;
}

// Moves the block to the target: removes the original, adds the block at
// the target, and selects it there
export function moveBlock(view: EditorView, target: DropTarget) {
  const dragged = getDraggedBlock(view.state);
  if (!dragged) return;

  const { from, to, node } = dragged;

  // dropped back home or onto itself, so nothing moves
  if (target.isHome || (target.pos > from && target.pos < to)) {
    endDrag(view);
    return;
  }

  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(from, to);

  const insertAt = tr.mapping.map(target.pos);
  tr.insert(insertAt, node);
  tr.setSelection(NodeSelection.create(tr.doc, insertAt));

  view.dispatch(tr);
}
