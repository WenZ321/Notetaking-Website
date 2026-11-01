import { describe, expect, test } from "vitest";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { joinRow } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/JoinRow";
import {
  getBlockWidths,
  makeBlock,
  makeLine,
  makeRow,
} from "../Helpers/TestPage";
import {
  describePage,
  drop,
  getBlockPositions,
  makeDrag,
  makeState,
} from "../Helpers/TestDrag";

// A page with a 200 wide block in its own row, then a row with a 300 wide
// block. The first block is dragged into the second row at the cursor
function dropFirstBlockIntoSecondRow(cursorLeft: number) {
  const state = makeState([
    makeRow("left", [makeBlock(200)]),
    makeLine("a"),
    makeRow("left", [makeBlock(300)]),
    makeLine("b"),
  ]);
  const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
  const target = joinRow(
    drag,
    drag.page.rows[1],
    { left: cursorLeft, top: 0 },
    "left",
    keepLength,
  );
  return drop(drag, target!.change!);
}

describe("joinRow", () => {
  test("a block dragged past the other row's block joins it on the right, and its old row goes away", () => {
    // the 300 wide block's middle is at 150
    const { doc, droppedBlock } = dropFirstBlockIntoSecondRow(200);

    expect(describePage(doc)).toEqual(["a", "row", "b"]);
    expect(getBlockWidths(doc.child(1))).toEqual([300, 200]);
    expect(droppedBlock.attrs.width).toBe(200);
  });

  test("a block dragged before the other row's block joins it on the left", () => {
    const { doc, droppedBlock } = dropFirstBlockIntoSecondRow(50);

    expect(describePage(doc)).toEqual(["a", "row", "b"]);
    expect(getBlockWidths(doc.child(1))).toEqual([200, 300]);
    expect(droppedBlock.attrs.width).toBe(200);
  });
});
