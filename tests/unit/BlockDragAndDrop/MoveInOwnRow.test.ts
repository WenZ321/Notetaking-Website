import type { WrappedBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { describe, expect, test } from "vitest";
import {
  buildOwnWrappedBlockMove,
  moveAloneInOwnRow,
  reorderOwnRow,
} from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import { HOME_TARGET } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import {
  MIN_TEXT_WIDTH,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import {
  getBlockWidths,
  getTextWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
} from "../Helpers/TestPage";
import {
  describePage,
  drop,
  getBlockPositions,
  makeDrag,
  makeState,
} from "../Helpers/TestDrag";

// Drags the first block of the row to the cursor
function dragFirstBlockTo(row: WrappedBlockNode, cursorLeft: number) {
  const state = makeState([row, makeLine("")]);
  const from = getBlockPositions(state.doc)[0];
  const drag = makeDrag(state, from);
  const target = reorderOwnRow(drag, from, drag.page.rows[0], {
    left: cursorLeft,
    top: 50,
  });
  return { drag, target };
}

// Drops the first block at the cursor, returning the new row and the block
// where the drop says the dragged one landed
function dropFirstBlockAt(row: WrappedBlockNode, cursorLeft: number) {
  const { drag, target } = dragFirstBlockTo(row, cursorLeft);
  const { doc, droppedBlock } = drop(drag, target.change!);
  return { row: doc.firstChild as WrappedBlockNode, droppedBlock };
}

describe("reorderOwnRow", () => {
  test("dragging a block past its neighbor's middle swaps them, and both stay", () => {
    // blocks of 200 and 300, so the second one's middle is at 350
    const row = makeRow("left", [makeBlock(200), makeBlock(300)]);
    const result = dropFirstBlockAt(row, 400);

    expect(getBlockWidths(result.row)).toEqual([300, 200]);
    expect(result.droppedBlock.attrs.width).toBe(200);
  });

  test("dropping a block back in its own gap changes nothing", () => {
    const row = makeRow("left", [makeBlock(200), makeBlock(300)]);
    const { target } = dragFirstBlockTo(row, 100);

    expect(target).toBe(HOME_TARGET);
  });

  test("swapping a newspaper's blocks keeps its text on both sides", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200), makeBlock(300)],
      [makeLine("right text")],
    );
    const result = dropFirstBlockAt(newspaper, 400);
    const columns = result.row.content.content;

    expect(getBlockWidths(result.row)).toEqual([300, 200]);
    expect(isTextColumn(columns[0])).toBe(true);
    expect(columns[0].textContent).toBe("left text");
    expect(columns[3].textContent).toBe("right text");
  });
});

describe("buildOwnWrappedBlockMove", () => {
  test("a newspaper wrapped to a side moves its left text above and its right text below", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200)],
      [makeLine("right text")],
    );
    const state = makeState([newspaper, makeLine("")]);
    const from = getBlockPositions(state.doc)[0];
    const change = buildOwnWrappedBlockMove(
      state,
      from,
      { wrap: "left", leftTextWidth: null },
      "aboveRow",
    );

    const { doc, droppedBlock } = drop(makeDrag(state, from), change);
    const [above, row, below] = doc.content.content;

    expect(above.textContent).toBe("left text");
    expect(row.attrs.wrap).toBe("left");
    expect(row.childCount).toBe(1);
    expect(getBlockWidths(row)).toEqual([200]);
    expect(below.textContent).toBe("right text");
    expect(droppedBlock.attrs.width).toBe(200);
  });
});

// Drags a block alone in its row, held grabOffsetX from its left edge, to
// the cursor on the 816 wide page
function dragAloneTo(
  row: WrappedBlockNode,
  cursorLeft: number,
  grabOffsetX: number,
) {
  const state = makeState([row, makeLine("")]);
  const from = getBlockPositions(state.doc)[0];
  const drag = { ...makeDrag(state, from), grabOffsetX };
  const target = moveAloneInOwnRow(drag, from, drag.page.rows[0], {
    left: cursorLeft,
    top: 50,
  });
  return { drag, target };
}

describe("moveAloneInOwnRow", () => {
  test("near the page's left edge the block wraps left", () => {
    const { drag, target } = dragAloneTo(
      makeRow("right", [makeBlock(200)]),
      50,
      0,
    );
    const { doc } = drop(drag, target.change!);

    expect(doc.firstChild!.attrs.wrap).toBe("left");
  });

  test("a newspaper dragged to the right edge keeps its block where it was, with all its text after it to flow beside it", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200)],
      [makeLine("right text")],
    );
    const { drag, target } = dragAloneTo(newspaper, 780, 0);
    const { doc, droppedBlock } = drop(drag, target.change!);

    expect(describePage(doc)).toEqual(["row", "left text", "right text", ""]);
    expect(doc.firstChild!.attrs.wrap).toBe("right");
    expect(droppedBlock.attrs.width).toBe(200);
  });

  test("in the middle it becomes a newspaper, its left text lined up with the block on the grid", () => {
    // the block's left edge at 300 snaps to 312, and the right text gets the rest
    const { drag, target } = dragAloneTo(
      makeRow("left", [makeBlock(200)]),
      300,
      0,
    );
    const row = drop(drag, target.change!).doc.firstChild as WrappedBlockNode;

    expect(row.attrs.wrap).toBe("newspaper");
    expect(getTextWidths(row)).toEqual([312, 304]);
  });

  test("a block with its left edge in the left strip wraps left", () => {
    // held 140 in, the block's left edge is at 100
    const { drag, target } = dragAloneTo(
      makeRow("right", [makeBlock(200)]),
      240,
      140,
    );
    const { doc } = drop(drag, target.change!);

    expect(doc.firstChild!.attrs.wrap).toBe("left");
  });

  test("a block just past the left strip becomes a newspaper with the narrowest left text", () => {
    const { drag, target } = dragAloneTo(
      makeRow("left", [makeBlock(200)]),
      MIN_TEXT_WIDTH + 2,
      0,
    );
    const row = drop(drag, target.change!).doc.firstChild as WrappedBlockNode;

    expect(row.attrs.wrap).toBe("newspaper");
    expect(getTextWidths(row)[0]).toBe(MIN_TEXT_WIDTH);
  });

  test("a newspaper dragged in the middle slides over, keeping its text", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200)],
      [makeLine("right text")],
    );
    const { drag, target } = dragAloneTo(newspaper, 300, 0);
    const row = drop(drag, target.change!).doc.firstChild as WrappedBlockNode;

    expect(row.attrs.wrap).toBe("newspaper");
    expect(getTextWidths(row)).toEqual([312, 304]);
    expect(row.firstChild!.textContent).toBe("left text");
    expect(row.lastChild!.textContent).toBe("right text");
  });

  test("a newspaper dragged to where its left text is already that wide stays home", () => {
    const first = dragAloneTo(makeRow("left", [makeBlock(200)]), 300, 0);
    const newspaper = drop(first.drag, first.target.change!).doc
      .firstChild as WrappedBlockNode;
    const { target } = dragAloneTo(newspaper, 300, 0);

    expect(target).toBe(HOME_TARGET);
  });

  test("a block reaching into both strips stays home", () => {
    // held at its middle, its edges are at 158 and 658
    const { target } = dragAloneTo(makeRow("left", [makeBlock(500)]), 408, 250);

    expect(target).toBe(HOME_TARGET);
  });
});
