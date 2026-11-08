import { afterEach, describe, expect, test, vi } from "vitest";
import { getClosedCoverRect } from "@/components/NotebookPage/ClosedCoverRect";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
  NOTEBOOK_VIEW_SCALE,
} from "@/constants/NotebookPageConstants";

// The notebook view's layout sizes, as the CSS sets them
const LAYOUT = {
  "--header-height": 56,
  "--notebook-view-top-margin": 32,
  "--notebook-rim-thickness": 12,
  "--notebook-spine-gap": 8,
};

// A window this wide, with the interface at this scale
function makeWindow(width: number, uiScale: number) {
  const sizes: Record<string, number> = { ...LAYOUT, "--ui-scale": uiScale };
  vi.stubGlobal("window", { innerWidth: width });
  vi.stubGlobal("document", { documentElement: {} });
  vi.stubGlobal("getComputedStyle", () => ({
    getPropertyValue: (name: string) => String(sizes[name]),
  }));
  vi.stubGlobal(
    "DOMRect",
    class {
      constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
      ) {}
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getClosedCoverRect", () => {
  test("the cover is centered across the window, under the header and top margin", () => {
    makeWindow(1400, 1);
    const rect = getClosedCoverRect();

    expect(rect.x + rect.width / 2).toBe(700);
    expect(rect.y).toBe(56 + 32);
  });

  test("the cover is one page with its rim and half the spine gap, at the view's scale", () => {
    makeWindow(1400, 1);
    const rect = getClosedCoverRect();
    const scale = NOTEBOOK_VIEW_SCALE;

    expect(rect.width).toBe(NOTEBOOK_PAGE_WIDTH * scale + 12 * scale + 4 * scale);
    expect(rect.height).toBe(NOTEBOOK_PAGE_HEIGHT * scale + 2 * 12 * scale);
  });

  test("a bigger interface draws the cover that much bigger and lower", () => {
    makeWindow(1400, 1);
    const small = getClosedCoverRect();
    makeWindow(1400, 2);
    const big = getClosedCoverRect();

    expect(big.width).toBe(small.width * 2);
    expect(big.height).toBe(small.height * 2);
    expect(big.y).toBe(small.y * 2);
  });
});
