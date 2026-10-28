import { describe, expect, test } from "vitest";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { snapToGraphSquares } from "@/components/NotebookPaperTypes/PaperLogic/GraphPaperSnapping";
import { addBlockToRow } from "@/tiptap/extensions/WrappedBlocks/AddBlockToRow";
import {
  getBlockHeights,
  getBlockWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
} from "../Helpers/TestPage";

// Content that needs no room, so only the block's own smallest width counts
const NO_CONTENT_MIN = { width: 0, height: 0 };

describe("addBlockToRow", () => {
  test("a block joins a one-block row and both keep their widths", () => {
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(200)]),
      wrap: "left",
      insertIndex: 1,
      newBlock: makeBlock(200),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([200, 200]);
    expect(result!.newColumnIndex).toBe(1);
  });

  test("a third block fills the page, taking what the other two leave", () => {
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(150), makeBlock(150)]),
      wrap: "left",
      insertIndex: 2,
      newBlock: makeBlock(150),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([
      150,
      150,
      NOTEBOOK_PAGE_WIDTH - 300,
    ]);
  });

  test("a full row pushes its rightmost block out to a new row below", () => {
    const rightmost = makeBlock(200);
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [
        makeBlock(200),
        makeBlock(200),
        rightmost,
      ]),
      wrap: "left",
      insertIndex: 3,
      newBlock: makeBlock(150),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, NO_CONTENT_MIN, NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    // a line of text, then the pushed out block in its own row
    const [line, pushedOutRow] = result!.below;
    expect(line.type.name).toBe("paragraph");
    expect(pushedOutRow.firstChild!.firstChild).toBe(rightmost);
    expect(getBlockWidths(result!.wrappedBlock)).toEqual([
      200,
      200,
      NOTEBOOK_PAGE_WIDTH - 400,
    ]);
  });

  test("a block that can't get its smallest width gives null", () => {
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(400), makeBlock(400)]),
      wrap: "left",
      insertIndex: 2,
      newBlock: makeBlock(150),
      newBlockMinSize: NO_CONTENT_MIN,
      // the two blocks' content needs all of their width, so neither shrinks
      existingBlockMinSizes: [
        { width: 400, height: 0 },
        { width: 400, height: 0 },
      ],
      snapBlockSide: keepLength,
    });

    expect(result).toBeNull();
  });

  test("a newspaper's left text moves above the row and its right text below", () => {
    const leftLine = makeLine("left text");
    const rightLine = makeLine("right text");
    const result = addBlockToRow({
      wrappedBlock: makeNewspaper([leftLine], [makeBlock(200)], [rightLine]),
      wrap: "left",
      insertIndex: 0,
      newBlock: makeBlock(200),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(result!.above).toEqual([leftLine]);
    expect(result!.below).toEqual([rightLine]);
    expect(result!.wrappedBlock.attrs.wrap).toBe("left");
  });

  test("a block can go between two blocks", () => {
    const newBlock = makeBlock(150);
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(150), makeBlock(150)]),
      wrap: "left",
      insertIndex: 1,
      newBlock,
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(result!.newColumnIndex).toBe(1);
    expect(result!.wrappedBlock.child(1).firstChild!.attrs.width).toBe(
      NOTEBOOK_PAGE_WIDTH - 300,
    );
  });

  test("the new block takes the row's height, not its own", () => {
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(200, 100)]),
      wrap: "left",
      insertIndex: 1,
      newBlock: makeBlock(200, 300),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(getBlockHeights(result!.wrappedBlock)).toEqual([100, 100]);
  });

  test("the row grows taller when the new block's content needs it", () => {
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(200, 100)]),
      wrap: "left",
      insertIndex: 1,
      newBlock: makeBlock(200, 100),
      newBlockMinSize: { width: 0, height: 250 },
      existingBlockMinSizes: [NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(getBlockHeights(result!.wrappedBlock)).toEqual([250, 250]);
  });

  test("the rightmost block gives up room first", () => {
    // 300 + 400 leaves 116, so the new block needs 34 more to reach 150
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(300), makeBlock(400)]),
      wrap: "left",
      insertIndex: 2,
      newBlock: makeBlock(200),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, NO_CONTENT_MIN],
      snapBlockSide: keepLength,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([300, 366, 150]);
  });

  test("a block gives up room only down to what its content needs", () => {
    // the right block can give only 10, so the left one gives the other 24
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(400), makeBlock(300)]),
      wrap: "left",
      insertIndex: 2,
      newBlock: makeBlock(200),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, { width: 290, height: 0 }],
      snapBlockSide: keepLength,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([376, 290, 150]);
  });

  test("on graph paper the new block rounds to whole squares", () => {
    // 205 is closest to 9 squares of 24
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(240)]),
      wrap: "left",
      insertIndex: 1,
      newBlock: makeBlock(205),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN],
      snapBlockSide: snapToGraphSquares,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([240, 216]);
  });

  test("on graph paper a full row still fills the page exactly", () => {
    // the leftover isn't rounded, or the row would end short of the page
    const result = addBlockToRow({
      wrappedBlock: makeRow("left", [makeBlock(240), makeBlock(240)]),
      wrap: "left",
      insertIndex: 2,
      newBlock: makeBlock(200),
      newBlockMinSize: NO_CONTENT_MIN,
      existingBlockMinSizes: [NO_CONTENT_MIN, NO_CONTENT_MIN],
      snapBlockSide: snapToGraphSquares,
    });

    expect(getBlockWidths(result!.wrappedBlock)).toEqual([
      240,
      240,
      NOTEBOOK_PAGE_WIDTH - 480,
    ]);
  });
});
