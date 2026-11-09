import { describe, expect, test } from "vitest";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { findDrop } from "@/tiptap/extensions/BlockDragAndDrop/FindDrop";
import { dropIntoText } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/DropIntoText";
import { joinRow } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/JoinRow";
import {
  moveAloneInOwnRow,
  reorderOwnRow,
} from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import {
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
} from "../Helpers/TestPage";
import { getBlockPositions, makeDrag, makeState } from "../Helpers/TestDrag";

// A page drawn top to bottom as: a line 0-20, a row wrapped left 20-120, the
// dragged block's own row 120-220, a newspaper 220-320, then a line 320-340.
// The newspaper's block runs from 0 to 200 across, so its middle is at 100
function makePageDrag() {
  const state = makeState([
    makeLine("a"),
    makeRow("left", [makeBlock(200)]),
    makeRow("left", [makeBlock(200)]),
    makeNewspaper([makeLine("left")], [makeBlock(200)], [makeLine("right")]),
    makeLine("b"),
  ]);
  return makeDrag(state, getBlockPositions(state.doc)[1]);
}

describe("findDrop", () => {
  test("over text, the block drops into the text", () => {
    const drag = makePageDrag();
    const cursor = { left: 50, top: 330 };

    expect(findDrop(drag, cursor, keepLength)).toEqual(
      dropIntoText(drag, cursor),
    );
  });

  test("over its own row alone, the block moves within it", () => {
    const drag = makePageDrag();
    const cursor = { left: 50, top: 170 };

    expect(findDrop(drag, cursor, keepLength)).toEqual(
      moveAloneInOwnRow(drag, drag.origin.startFrom, drag.page.rows[1], cursor),
    );
  });

  test("over its own row with other blocks, the blocks are reordered", () => {
    const state = makeState([
      makeRow("left", [makeBlock(200), makeBlock(200)]),
    ]);
    const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
    const cursor = { left: 350, top: 50 };

    expect(findDrop(drag, cursor, keepLength)).toEqual(
      reorderOwnRow(drag, drag.origin.startFrom, drag.page.rows[0], cursor),
    );
  });

  test("over another floated row, the block joins it on that row's wrap", () => {
    const drag = makePageDrag();
    const cursor = { left: 150, top: 70 };

    expect(findDrop(drag, cursor, keepLength)).toEqual(
      joinRow(drag, drag.page.rows[0], cursor, "left", keepLength),
    );
  });

  test("over a newspaper, the block joins it wrapping to the side of its blocks the cursor is on", () => {
    const drag = makePageDrag();
    const newspaper = drag.page.rows[2];
    const leftCursor = { left: 50, top: 270 };
    const rightCursor = { left: 150, top: 270 };

    expect(findDrop(drag, leftCursor, keepLength)).toEqual(
      joinRow(drag, newspaper, leftCursor, "left", keepLength),
    );
    expect(findDrop(drag, rightCursor, keepLength)).toEqual(
      joinRow(drag, newspaper, rightCursor, "right", keepLength),
    );
  });
});
