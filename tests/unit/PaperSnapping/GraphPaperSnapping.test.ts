import { describe, expect, test } from "vitest";
import { snapToGraphSquares } from "@/components/NotebookPaperTypes/PaperLogic/GraphPaperSnapping";

// Graph squares are 24 wide
describe("snapToGraphSquares", () => {
  test("a length rounds to the closest whole number of squares", () => {
    expect(snapToGraphSquares(50, { min: 30, max: 100 })).toBe(48);
    expect(snapToGraphSquares(65, { min: 30, max: 100 })).toBe(72);
  });

  test("it stays within the whole squares that fit the limits", () => {
    expect(snapToGraphSquares(10, { min: 30, max: 100 })).toBe(48);
    expect(snapToGraphSquares(500, { min: 30, max: 100 })).toBe(96);
  });

  test("when no whole number of squares fits, it only stays within the limits", () => {
    expect(snapToGraphSquares(175, { min: 170, max: 180 })).toBe(175);
    expect(snapToGraphSquares(100, { min: 170, max: 180 })).toBe(170);
  });
});
