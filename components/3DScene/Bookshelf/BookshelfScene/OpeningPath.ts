import type { ShelfLayout } from "../ShelfLayout";
import { OPEN_SLIDE, PULL_OUT_LIFT, TABLE_BELOW_SHELF } from "../BookshelfLook";
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
