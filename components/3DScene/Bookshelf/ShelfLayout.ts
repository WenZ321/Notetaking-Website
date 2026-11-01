import {
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "../NotebookModel/NotebookLook";
import {
  MIN_SHELF_ROWS,
  SHELF_BOARD_THICKNESS,
  SHELF_END_SPACE,
  SHELF_NOTEBOOK_GAP,
  SHELF_NOTEBOOK_THICKNESS,
  SHELF_ROW_HEIGHT,
} from "./BookshelfLook";

// The shelf's size in scene units, its rows, and how many notebooks fit in
// each row
export type ShelfLayout = {
  width: number;
  height: number;
  rows: number;
  notebooksPerRow: number;
};

// Each notebook takes its own thickness plus a gap to the next one
const NOTEBOOK_STEP = SHELF_NOTEBOOK_THICKNESS + SHELF_NOTEBOOK_GAP;

/**
 * Lays out the shelf for its notebooks. A row holds as many notebooks as
 * fit its width, and the shelf has at least MIN_SHELF_ROWS rows, more when
 * the notebooks need them
 * @param width The shelf's width, in scene units
 * @param notebookCount How many notebooks it holds
 * @returns The shelf's size, rows and notebooks per row
 */
export function getShelfLayout(
  width: number,
  notebookCount: number,
): ShelfLayout {
  // the last notebook in a row needs no gap after it
  const rowRoom =
    width -
    2 * SHELF_BOARD_THICKNESS -
    2 * SHELF_END_SPACE +
    SHELF_NOTEBOOK_GAP;
  const notebooksPerRow = Math.max(1, Math.floor(rowRoom / NOTEBOOK_STEP));
  const rows = Math.max(
    MIN_SHELF_ROWS,
    Math.ceil(notebookCount / notebooksPerRow),
  );

  // every row has a board above it, and the bottom row one below too
  const height =
    rows * SHELF_ROW_HEIGHT + (rows + 1) * SHELF_BOARD_THICKNESS;
  return { width, height, rows, notebooksPerRow };
}

/**
 * Where a notebook's middle sits on the shelf. Notebooks fill the top row
 * left to right, then the row below it
 * @param index The notebook's place in the library
 * @param layout The shelf's layout
 * @returns Its middle, standing on its row's board with its spine near the front
 */
export function getShelfNotebookPosition(
  index: number,
  layout: ShelfLayout,
): [number, number, number] {
  const row = Math.floor(index / layout.notebooksPerRow);
  const place = index % layout.notebooksPerRow;

  const firstX =
    -layout.width / 2 +
    SHELF_BOARD_THICKNESS +
    SHELF_END_SPACE +
    SHELF_NOTEBOOK_THICKNESS / 2;
  const rowFloor = getRowTop(row, layout) - SHELF_ROW_HEIGHT;

  return [
    firstX + place * NOTEBOOK_STEP,
    rowFloor + NOTEBOOK_HEIGHT / 2,
    -NOTEBOOK_WIDTH / 2 - 0.03,
  ];
}

/**
 * Where a row's inside starts at its top, just under the board above it
 * @param row The row, 0 being the top one
 * @param layout The shelf's layout
 * @returns The height of the row's top
 */
export function getRowTop(row: number, layout: ShelfLayout): number {
  return (
    layout.height / 2 -
    SHELF_BOARD_THICKNESS -
    row * (SHELF_ROW_HEIGHT + SHELF_BOARD_THICKNESS)
  );
}
