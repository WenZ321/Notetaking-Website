import { describe, expect, test } from "vitest";
import {
  NOTEBOOK_PAGE_WIDTH,
  WRAP_GAP,
} from "@/constants/NotebookPageConstants";
import {
  MIN_TEXT_WIDTH,
  getBlocksRoom,
  getNewspaperTextWidths,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

describe("getBlocksRoom", () => {
  test("a floated row leaves its text the smallest width, plus the gap", () => {
    const room = NOTEBOOK_PAGE_WIDTH - MIN_TEXT_WIDTH - WRAP_GAP;
    expect(getBlocksRoom("left")).toBe(room);
    expect(getBlocksRoom("right")).toBe(room);
  });

  test("a newspaper leaves both of its texts the smallest width", () => {
    expect(getBlocksRoom("newspaper")).toBe(
      NOTEBOOK_PAGE_WIDTH - 2 * MIN_TEXT_WIDTH,
    );
  });
});

describe("getNewspaperTextWidths", () => {
  // the blocks take 216, leaving 600 for the two texts
  const blocksWidth = 216;
  const textSpace = NOTEBOOK_PAGE_WIDTH - blocksWidth;

  test("new text splits the space evenly", () => {
    expect(getNewspaperTextWidths(blocksWidth, null)).toEqual([300, 300]);
  });

  test("the left text keeps its saved width and the right fills the rest", () => {
    expect(getNewspaperTextWidths(blocksWidth, 200)).toEqual([200, 400]);
  });

  test("a saved left width too small grows to the smallest text width", () => {
    expect(getNewspaperTextWidths(blocksWidth, 50)).toEqual([
      MIN_TEXT_WIDTH,
      textSpace - MIN_TEXT_WIDTH,
    ]);
  });

  test("a saved left width too big leaves the right text its smallest", () => {
    expect(getNewspaperTextWidths(blocksWidth, 590)).toEqual([
      textSpace - MIN_TEXT_WIDTH,
      MIN_TEXT_WIDTH,
    ]);
  });
});
