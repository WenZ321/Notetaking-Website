import { describe, expect, test } from "vitest";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
  snapBlockSizeToPaper,
} from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import { GRAPH_PAPER_SQUARE_SIZE } from "@/constants/NotebookPageConstants";

const LIMITS = { maxWidth: 600, maxHeight: 400 };

describe("snapBlockSizeToPaper", () => {
  test("on graph paper a new block's sides are whole squares", () => {
    const size = snapBlockSizeToPaper(
      { width: 250, height: 110 },
      "graph",
      LIMITS,
    );

    expect(size.width % GRAPH_PAPER_SQUARE_SIZE).toBe(0);
    expect(size.height % GRAPH_PAPER_SQUARE_SIZE).toBe(0);
  });

  test("on other paper a new block keeps its size", () => {
    (["blank", "lined", "dotGrid"] as const).forEach((paperType) => {
      expect(
        snapBlockSizeToPaper({ width: 250, height: 110 }, paperType, LIMITS),
      ).toEqual({ width: 250, height: 110 });
    });
  });

  test("a size past the limits is brought back within them", () => {
    expect(
      snapBlockSizeToPaper({ width: 10, height: 2 }, "blank", LIMITS),
    ).toEqual({ width: MIN_BLOCK_WIDTH, height: MIN_BLOCK_HEIGHT });
    expect(
      snapBlockSizeToPaper({ width: 900, height: 900 }, "blank", LIMITS),
    ).toEqual({ width: 600, height: 400 });
  });

  test("the block's other settings stay as they were", () => {
    const size = snapBlockSizeToPaper(
      { width: 250, height: 110, color: "red" },
      "blank",
      LIMITS,
    );

    expect(size.color).toBe("red");
  });
});
