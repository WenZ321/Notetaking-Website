import type { WrappedBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { describe, expect, test } from "vitest";
import {
  buildOwnWrappedBlockMove,
  reorderOwnRow,
} from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import { HOME_TARGET } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import {
  getBlockWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
} from "../Helpers/TestPage";
import {
  drop,
  getBlockPositions,
  makeDrag,
  makeState,
} from "../Helpers/TestDrag";

// Drags the first block of the row to the cursor
function dragFirstBlockTo(row: WrappedBlockNode, cursorLeft: number) {
  const state = makeState([row, makeLine("")]);
  const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
  const target = reorderOwnRow(drag, drag.page.rows[0], {
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
    const change = buildOwnWrappedBlockMove(state, from, {
      wrap: "left",
      leftTextWidth: null,
    })!;

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
