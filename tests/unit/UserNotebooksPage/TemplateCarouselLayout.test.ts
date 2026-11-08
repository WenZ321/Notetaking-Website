import { describe, expect, test } from "vitest";
import {
  MIDDLE_REACH,
  MIDDLE_SIZE,
  VISIBLE_SIDE_COVERS,
  getCoverSide,
  getLoopedOffset,
  moveStartIndex,
} from "@/components/UserNotebooksPage/TemplateCarouselLayout";

// The app's 12 cover styles
const TOTAL = 12;

// Every cover's distance from the middle, in cover order
function getOffsets(startIndex: number, hiddenSide: "left" | "right") {
  return Array.from({ length: TOTAL }, (_, index) =>
    getLoopedOffset(index, startIndex, hiddenSide, TOTAL),
  );
}

describe("getLoopedOffset", () => {
  test("the start cover and the ones after it fill the middle", () => {
    const offsets = getOffsets(0, "right");

    expect(offsets.slice(0, MIDDLE_SIZE)).toEqual([-1.5, -0.5, 0.5, 1.5]);
    offsets
      .slice(0, MIDDLE_SIZE)
      .forEach((offset) => expect(getCoverSide(offset)).toBe("middle"));
  });

  test("covers before the start wrap around to the left side", () => {
    const offsets = getOffsets(0, "right");

    expect(offsets[TOTAL - 1]).toBe(-MIDDLE_REACH - 1);
    expect(offsets[TOTAL - 2]).toBe(-MIDDLE_REACH - 2);
  });

  test("every cover gets its own place, whichever side the hidden ones wait on", () => {
    (["left", "right"] as const).forEach((hiddenSide) => {
      const offsets = getOffsets(5, hiddenSide);
      expect(new Set(offsets).size).toBe(TOTAL);
    });
  });

  test("the hidden covers all wait on the chosen side", () => {
    const hiddenCount = TOTAL - MIDDLE_SIZE - 2 * VISIBLE_SIDE_COVERS;
    const sideReach = MIDDLE_REACH + VISIBLE_SIDE_COVERS;

    const waitingRight = getOffsets(0, "right").filter((offset) => offset > sideReach);
    const waitingLeft = getOffsets(0, "left").filter((offset) => offset < -sideReach);

    expect(waitingRight).toHaveLength(hiddenCount);
    expect(waitingLeft).toHaveLength(hiddenCount);
  });
});

describe("moveStartIndex", () => {
  test("moves a whole middle's worth each way", () => {
    expect(moveStartIndex(0, "next", TOTAL)).toBe(MIDDLE_SIZE);
    expect(moveStartIndex(MIDDLE_SIZE, "previous", TOTAL)).toBe(0);
  });

  test("loops past either end", () => {
    expect(moveStartIndex(10, "next", TOTAL)).toBe(2);
    expect(moveStartIndex(2, "previous", TOTAL)).toBe(10);
  });
});
