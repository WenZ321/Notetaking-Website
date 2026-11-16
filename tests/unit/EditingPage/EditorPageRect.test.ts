import { afterEach, describe, expect, test, vi } from "vitest";
import { getEditorPageRect } from "@/components/EditingPage/EditorPageRect";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";

// The editor's layout sizes, as the CSS sets them
const LAYOUT = {
  "--header-height": 56,
  "--toolbar-height": 44,
  "--space-2": 8,
  "--space-4": 16,
  "--notebook-rim-thickness": 12,
  "--page-flip-button-size": 40,
  "--editor-sidebar-min-width": 240,
  "--editor-sidebar-max-width": 320,
  "--editor-page-border": 1,
};

// The page and its two arrows with their gaps, at real size. The arrows
// sit 4px further out than the other gaps
const ARROW_GAP = 16 + 4;
const PAGE_WITH_ARROWS = NOTEBOOK_PAGE_WIDTH + 2 + 2 * 40 + 2 * ARROW_GAP;

// A window this wide, with the interface at this scale and the insert
// panel shown or hidden
function makeWindow(width: number, uiScale: number, isPanelHidden: boolean) {
  const sizes: Record<string, number> = { ...LAYOUT, "--ui-scale": uiScale };
  vi.stubGlobal("document", { documentElement: { clientWidth: width } });
  vi.stubGlobal("getComputedStyle", () => ({
    getPropertyValue: (name: string) => String(sizes[name]),
  }));
  vi.stubGlobal("localStorage", {
    getItem: () => String(isPanelHidden),
  });
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

const middleOf = (rect: DOMRect) => rect.x + rect.width / 2;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getEditorPageRect", () => {
  test("the page is centered in the whole window, beside the insert panel", () => {
    // wide enough for the empty column and the panel to both take their widest
    makeWindow(1800, 1, false);

    expect(middleOf(getEditorPageRect())).toBe(900);
  });

  test("in a tighter window the page slides left instead of going under the panel", () => {
    // room for the panel at its smallest and only 40 more for the empty column
    makeWindow(PAGE_WITH_ARROWS + 2 * 16 + 240 + 40, 1, false);
    const rect = getEditorPageRect();

    // the room is shared: the empty column gets 20, the panel 260
    expect(rect.x).toBe(20 + 16 + 40 + ARROW_GAP + 1);
  });

  test("with the panel hidden, the page is centered in the whole window", () => {
    makeWindow(1600, 1, true);

    expect(middleOf(getEditorPageRect())).toBe(800);
  });

  test("in a narrow window the page still has room for its arrows on the left", () => {
    makeWindow(PAGE_WITH_ARROWS, 1, false);
    const rect = getEditorPageRect();

    // the empty column has no width, but the gap after it stays
    expect(rect.x).toBe(16 + 40 + ARROW_GAP + 1);
  });

  test("the paper sits under the header, toolbar and rim, inside its border", () => {
    makeWindow(1600, 1, false);

    expect(getEditorPageRect().y).toBe(56 + 44 + 8 + 12 + 16 + 1);
  });

  test("a bigger interface draws the paper that much bigger", () => {
    makeWindow(3200, 2, false);
    const rect = getEditorPageRect();

    expect(rect.width).toBe(NOTEBOOK_PAGE_WIDTH * 2);
    expect(rect.height).toBe(NOTEBOOK_PAGE_HEIGHT * 2);
  });
});
