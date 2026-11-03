import { describe, expect, test } from "vitest";
import {
  getRightPageIndex,
  parseRightPageIndex,
} from "@/components/NotebookPage/NotebookPageUrl";

describe("getRightPageIndex", () => {
  test("odd pages sit on the right, even pages lead to the odd page after them", () => {
    expect(getRightPageIndex(1)).toBe(1);
    expect(getRightPageIndex(2)).toBe(3);
    expect(getRightPageIndex(3)).toBe(3);
    expect(getRightPageIndex(4)).toBe(5);
  });

  test("the cover and anything before it is the cover", () => {
    expect(getRightPageIndex(0)).toBe(0);
    expect(getRightPageIndex(-4)).toBe(0);
  });
});

describe("parseRightPageIndex", () => {
  test("a missing or invalid page shows the cover", () => {
    expect(parseRightPageIndex(null, 6)).toBe(0);
    expect(parseRightPageIndex("abc", 6)).toBe(0);
  });

  test("a page opens at its pair's right page", () => {
    expect(parseRightPageIndex("2", 6)).toBe(3);
  });

  test("a page past the end shows the last pair", () => {
    expect(parseRightPageIndex("99", 6)).toBe(5);
  });
});
