import { describe, expect, test } from "vitest";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { findDrop } from "@/tiptap/extensions/BlockDragAndDrop/FindDrop";
import { dropIntoText } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/DropIntoText";
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
  makePanelDrag,
  makeState,
} from "../Helpers/TestDrag";

describe("a new block dragged from the insert panel", () => {
  test("dropped into text, it gets its own row and nothing else leaves", () => {
    // "hello" is 0 to 20 and "world" 20 to 40, so 25 is world's top half
    const state = makeState([makeLine("hello"), makeLine("world")]);
    const drag = makePanelDrag(state, makeBlock(200));
    const target = dropIntoText(drag, { left: 50, top: 25 });
    const { doc, droppedBlock } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["hello", "row", "world"]);
    expect(droppedBlock.attrs.width).toBe(200);
  });

  test("dropped past a row's block, it joins that row and the row's block stays", () => {
    const state = makeState([makeRow("left", [makeBlock(300)]), makeLine("b")]);
    const drag = makePanelDrag(state, makeBlock(200));
    const target = joinRow(
      drag,
      drag.page.rows[0],
      { left: 200, top: 50 },
      "left",
      keepLength,
    );
    const { doc } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["row", "b"]);
    expect(getBlockWidths(doc.child(0))).toEqual([300, 200]);
  });

  test("over a row with one block, it joins the row instead of moving that block", () => {
    const state = makeState([makeRow("left", [makeBlock(300)]), makeLine("b")]);
    const drag = makePanelDrag(state, makeBlock(200));
    const cursor = { left: 200, top: 50 };

    expect(findDrop(drag, cursor, keepLength)).toEqual(
      joinRow(drag, drag.page.rows[0], cursor, "left", keepLength),
    );
  });
});
