import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readRowTopGaps } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";

// A stand-in row with the top it's drawn at and the gap it's drawn with
function makeRow(offsetTop: number, drawnGap = 0) {
  return { offsetTop, drawnGap } as unknown as HTMLElement;
}

describe("readRowTopGaps", () => {
  beforeEach(() => {
    vi.stubGlobal("getComputedStyle", (row: { drawnGap: number }) => ({
      paddingTop: `${row.drawnGap}px`,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves a row down to the next line", () => {
    expect(readRowTopGaps([makeRow(38)], 24)).toEqual([10]);
  });

  it("leaves a row already on a line where it is", () => {
    expect(readRowTopGaps([makeRow(0), makeRow(48)], 24)).toEqual([0, 0]);
  });

  it("counts the gap above a row for the rows after it", () => {
    expect(readRowTopGaps([makeRow(38), makeRow(100)], 24)).toEqual([10, 10]);
  });

  it("gives the same gaps when they're already drawn", () => {
    expect(readRowTopGaps([makeRow(38, 10), makeRow(110, 10)], 24)).toEqual([
      10, 10,
    ]);
  });

  it("adds no gaps on a paper with no lines to start on", () => {
    expect(readRowTopGaps([makeRow(38), makeRow(101)], 1)).toEqual([0, 0]);
  });
});
