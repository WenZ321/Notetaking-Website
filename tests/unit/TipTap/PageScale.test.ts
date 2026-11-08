import type { EditorView } from "@tiptap/pm/view";
import { describe, expect, test } from "vitest";
import { getPageScale } from "@/tiptap/PageScale";

// A page whose real width is realWidth, drawn shownWidth wide on screen
function makeView(realWidth: number, shownWidth: number) {
  return {
    dom: {
      offsetWidth: realWidth,
      getBoundingClientRect: () => ({ width: shownWidth }),
    },
  } as unknown as EditorView;
}

describe("getPageScale", () => {
  test("is how much bigger the page is drawn than its real size", () => {
    expect(getPageScale(makeView(816, 816))).toBe(1);
    expect(getPageScale(makeView(816, 1632))).toBe(2);
  });

  test("a page not drawn yet counts as its real size", () => {
    expect(getPageScale(makeView(0, 0))).toBe(1);
  });
});
