import { describe, expect, test } from "vitest";
import {
  getShelfLayout,
  getShelfNotebookPosition,
} from "@/components/3DScene/Bookshelf/ShelfLayout";
import {
  MIN_SHELF_ROWS,
  SHELF_BOARD_THICKNESS,
} from "@/components/3DScene/Bookshelf/BookshelfLook";

// About the width of the shelf on a laptop screen, in scene units
const SHELF_WIDTH = 6.5;

describe("getShelfLayout", () => {
  test("an empty or small library still gets the default number of rows", () => {
    expect(getShelfLayout(SHELF_WIDTH, 0).rows).toBe(MIN_SHELF_ROWS);
    expect(getShelfLayout(SHELF_WIDTH, 3).rows).toBe(MIN_SHELF_ROWS);
  });

  test("a wider shelf fits more notebooks in a row", () => {
    const narrow = getShelfLayout(3, 0);
    const wide = getShelfLayout(SHELF_WIDTH, 0);

    expect(wide.notebooksPerRow).toBeGreaterThan(narrow.notebooksPerRow);
  });

  test("notebooks past the default rows add more rows, and a taller shelf", () => {
    const { notebooksPerRow, height } = getShelfLayout(SHELF_WIDTH, 0);
    const oneTooMany = notebooksPerRow * MIN_SHELF_ROWS + 1;
    const grown = getShelfLayout(SHELF_WIDTH, oneTooMany);

    expect(grown.rows).toBe(MIN_SHELF_ROWS + 1);
    expect(grown.height).toBeGreaterThan(height);
  });
});

describe("getShelfNotebookPosition", () => {
  test("notebooks fill a row left to right, then start the next row lower down at the left", () => {
    const layout = getShelfLayout(SHELF_WIDTH, 40);
    const first = getShelfNotebookPosition(0, layout);
    const second = getShelfNotebookPosition(1, layout);
    const lastInRow = getShelfNotebookPosition(layout.notebooksPerRow - 1, layout);
    const nextRow = getShelfNotebookPosition(layout.notebooksPerRow, layout);

    expect(second[0]).toBeGreaterThan(first[0]);
    expect(second[1]).toBe(first[1]);
    expect(nextRow[0]).toBe(first[0]);
    expect(nextRow[1]).toBeLessThan(first[1]);
    // the row's last notebook still fits inside the right side board
    expect(lastInRow[0]).toBeLessThan(SHELF_WIDTH / 2 - SHELF_BOARD_THICKNESS);
  });
});
