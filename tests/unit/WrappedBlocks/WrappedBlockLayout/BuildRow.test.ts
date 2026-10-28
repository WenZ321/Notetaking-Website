import { describe, expect, test } from "vitest";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { getBlocksRoom } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { arrangeTopLevelNode } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/BuildRow";
import {
  getBlockHeights,
  getBlocks,
  getTextWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
  schema,
} from "../../Helpers/TestPage";

describe("arrangeTopLevelNode", () => {
  test("a line of text stays as it is", () => {
    const line = makeLine("hello");
    expect(arrangeTopLevelNode(line, schema)).toEqual([line]);
  });

  test("a block on its own gets a row wrapped left", () => {
    const block = makeBlock(200);
    const [row] = arrangeTopLevelNode(block, schema);

    expect(row.type.name).toBe("WrappedBlock");
    expect(row.attrs.wrap).toBe("left");
    expect(getBlocks(row)).toEqual([block]);
  });

  test("every block in a row takes the tallest one's height", () => {
    const row = makeRow("left", [makeBlock(200, 100), makeBlock(200, 300)]);
    const [arranged] = arrangeTopLevelNode(row, schema);

    expect(getBlockHeights(arranged)).toEqual([300, 300]);
  });

  test("a fourth block moves to a row of its own below", () => {
    const fourth = makeBlock(150);
    const row = makeRow("left", [
      makeBlock(150),
      makeBlock(150),
      makeBlock(150),
      fourth,
    ]);
    const [arranged, movedOut] = arrangeTopLevelNode(row, schema);

    expect(getBlocks(arranged)).toHaveLength(3);
    expect(getBlocks(movedOut)).toEqual([fourth]);
  });

  test("a block past the page's width moves to a row of its own below", () => {
    // 500 + 400 is wider than the page
    const second = makeBlock(400);
    const row = makeRow("left", [makeBlock(500), second]);
    const [arranged, movedOut] = arrangeTopLevelNode(row, schema);

    expect(getBlocks(arranged)).toHaveLength(1);
    expect(getBlocks(movedOut)).toEqual([second]);
  });

  test("a newspaper keeps its left text's width and the right fills the rest", () => {
    // makeNewspaper saves the left text at 200
    const row = makeNewspaper(
      [makeLine("left")],
      [makeBlock(216)],
      [makeLine("right")],
    );
    const [arranged] = arrangeTopLevelNode(row, schema);

    expect(getTextWidths(arranged)).toEqual([
      200,
      NOTEBOOK_PAGE_WIDTH - 216 - 200,
    ]);
  });

  test("a newspaper whose block can't leave text on both sides wraps left", () => {
    const leftLine = makeLine("left");
    const rightLine = makeLine("right");
    const tooWide = getBlocksRoom("newspaper") + 10;
    const row = makeNewspaper([leftLine], [makeBlock(tooWide)], [rightLine]);
    const [above, arranged, below] = arrangeTopLevelNode(row, schema);

    // its left text moves above the row and its right text below
    expect(above).toEqual(leftLine);
    expect(arranged.attrs.wrap).toBe("left");
    expect(below).toEqual(rightLine);
  });

  test("a row with no blocks left is just its text", () => {
    const leftLine = makeLine("left");
    const rightLine = makeLine("right");
    const row = makeNewspaper([leftLine], [], [rightLine]);

    expect(arrangeTopLevelNode(row, schema)).toEqual([leftLine, rightLine]);
  });
});
