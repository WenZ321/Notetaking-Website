import { describe, expect, test } from "vitest";
import { dropIntoText } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/DropIntoText";
import { HOME_TARGET } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import {
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

// A block in its own row, then two lines. On screen the row is 0 to 100,
// "hello" is 100 to 120 and "world" is 120 to 140
function dragBlockToHeight(cursorTop: number, cursorLeft = 0) {
  const state = makeState([
    makeRow("left", [makeBlock(200)]),
    makeLine("hello"),
    makeLine("world"),
  ]);
  const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
  const cursor = { left: cursorLeft, top: cursorTop };
  return { drag, target: dropIntoText(drag, cursor) };
}

// Drops a block of this width onto the top half of the line "world", with
// the cursor this far across the page
function dropAcrossPage(cursorLeft: number, blockWidth = 200) {
  const state = makeState([
    makeLine("hello"),
    makeLine("world"),
    makeRow("left", [makeBlock(blockWidth)]),
    makeLine("end"),
  ]);
  const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
  const target = dropIntoText(drag, { left: cursorLeft, top: 25 });
  const { doc, droppedBlock } = drop(drag, target!.change!);
  return { row: doc.child(1), droppedBlock, doc };
}

describe("dropIntoText", () => {
  test("a block dropped near the left edge wraps left", () => {
    expect(dropAcrossPage(50).row.attrs.wrap).toBe("left");
  });

  test("a block dropped near the right edge wraps right", () => {
    expect(dropAcrossPage(780).row.attrs.wrap).toBe("right");
  });

  test("a block dropped in the middle becomes a newspaper, lined up with the block on the grid", () => {
    // held at its middle, the block's left edge at 300 snaps to 312
    const { row, droppedBlock, doc } = dropAcrossPage(400);

    expect(row.attrs.wrap).toBe("newspaper");
    expect(row.childCount).toBe(3);
    expect(row.firstChild!.attrs.width).toBe(312);
    expect(row.firstChild!.textContent).toBe("");
    expect(row.lastChild!.textContent).toBe("");
    expect(droppedBlock.attrs.width).toBe(200);
    expect(describePage(doc)).toEqual(["hello", "row", "world", "end"]);
  });

  test("a block too wide for a newspaper wraps to the side the cursor is nearer", () => {
    expect(dropAcrossPage(300, 600).row.attrs.wrap).toBe("left");
    expect(dropAcrossPage(500, 600).row.attrs.wrap).toBe("right");
  });

  test("a block dropped on a line's top half becomes its own row above that line", () => {
    const { drag, target } = dragBlockToHeight(125);
    const { doc, droppedBlock } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["hello", "row", "world"]);
    expect(droppedBlock.attrs.width).toBe(200);
  });

  test("a block dropped below the last line gets a line of text after its row", () => {
    const { drag, target } = dragBlockToHeight(135);
    const { doc } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["hello", "world", "row", ""]);
  });

  test("a block dropped right under its own row stays where it is", () => {
    const { target } = dragBlockToHeight(105);

    expect(target).toBe(HOME_TARGET);
  });

  test("a block dropped in the gap above a row lands above that row", () => {
    const state = makeState([
      makeLine("hello"),
      makeRow("left", [makeBlock(100)]),
      makeLine("middle"),
      makeRow("left", [makeBlock(200)]),
      makeLine("end"),
    ]);
    const drag = makeDrag(state, getBlockPositions(state.doc)[1]);

    // "hello" ends at 20, and paper lines push the row down to start at 30
    drag.page.rows[0].top = 30;
    const target = dropIntoText(drag, { left: 0, top: 25 });
    const { doc, droppedBlock } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual([
      "hello",
      "row",
      "",
      "row",
      "middle",
      "end",
    ]);
    expect(droppedBlock.attrs.width).toBe(200);
  });

  test("a newspaper dropped in the gap above a row sits right on it, with no line between", () => {
    const state = makeState([
      makeLine("hello"),
      makeRow("left", [makeBlock(100)]),
      makeLine("middle"),
      makeRow("left", [makeBlock(200)]),
      makeLine("end"),
    ]);
    const drag = makeDrag(state, getBlockPositions(state.doc)[1]);

    drag.page.rows[0].top = 30;
    const target = dropIntoText(drag, { left: 300, top: 25 });
    const { doc } = drop(drag, target!.change!);

    expect(doc.child(1).attrs.wrap).toBe("newspaper");
    expect(describePage(doc)).toEqual(["hello", "row", "row", "middle", "end"]);
  });

  test("a block dropped right under its own row in another zone changes wrap where it is", () => {
    const { drag, target } = dragBlockToHeight(105, 780);
    const { doc } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["row", "hello", "world"]);
    expect(doc.firstChild!.attrs.wrap).toBe("right");
  });

  test("a block dropped right under its own row in the middle becomes a newspaper where it is", () => {
    const { drag, target } = dragBlockToHeight(105, 400);
    const { doc } = drop(drag, target!.change!);

    expect(describePage(doc)).toEqual(["row", "hello", "world"]);
    expect(doc.firstChild!.attrs.wrap).toBe("newspaper");
  });

  test("a newspaper's block dropped right under its row leaves the row, since the row has text too", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200)],
      [makeLine("right text")],
    );
    const state = makeState([newspaper, makeLine("hello")]);
    const drag = makeDrag(state, getBlockPositions(state.doc)[0]);
    const target = dropIntoText(drag, { left: 0, top: 105 });

    expect(target).not.toBe(HOME_TARGET);
    expect(target!.change!.start).toBe(newspaper.nodeSize);
  });
});
