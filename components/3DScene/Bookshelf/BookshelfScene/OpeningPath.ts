import type { ShelfLayout } from "../ShelfLayout";
import {
  OPEN_SLIDE,
  PULL_OUT_LIFT,
  SHELF_NOTEBOOK_THICKNESS,
  TABLE_BELOW_SHELF,
  TABLE_IN_FRONT,
} from "../BookshelfLook";
import { getShelfNotebookPosition } from "../ShelfLayout";

// A notebook being opened: when it was chosen, where the shelf was on
// screen then, where the notebook view will draw its cover, which it lands
// on, and when its flight down to the table started, null while it slides out
export type Opening = {
  notebookId: string;
  startedAt: number;
  shelfRect: DOMRect;
  landingRect: DOMRect;
  flightStartedAt: number | null;
};

// How far the view's middle is moved so what the camera aims at shows up
// in the middle of this box on screen, in a picture fullWidth by fullHeight
export function getViewOffset(
  rect: DOMRect,
  fullWidth: number,
  fullHeight: number,
) {
  return {
    x: fullWidth / 2 - (rect.x + rect.width / 2),
    y: fullHeight / 2 - (rect.y + rect.height / 2),
  };
}

// The chosen notebook's middle once it has slid out of the shelf
export function getSlidOutPosition(
  index: number,
  layout: ShelfLayout,
): [number, number, number] {
  const [x, y, z] = getShelfNotebookPosition(index, layout);
  return [x, y + PULL_OUT_LIFT, z + OPEN_SLIDE];
}

// The table's top sits below and in front of the shelf
export function getTableTop(shelfHeight: number) {
  return -shelfHeight / 2 - TABLE_BELOW_SHELF;
}

// The chosen notebook's middle once it lies in the middle of the table
export function getLandedPosition(
  shelfHeight: number,
): [number, number, number] {
  return [
    0,
    getTableTop(shelfHeight) + SHELF_NOTEBOOK_THICKNESS / 2,
    TABLE_IN_FRONT,
  ];
}
