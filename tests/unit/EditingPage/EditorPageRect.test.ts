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

// The page and its two arrows with their gaps, at real size
const PAGE_WITH_ARROWS = NOTEBOOK_PAGE_WIDTH + 2 + 2 * 40 + 2 * 16;

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
  test("the page is centered in the room left of the insert panel", () => {
    makeWindow(1600, 1, false);
    const rect = getEditorPageRect();

    // the panel takes its widest, after the gap between the columns
    const pageColumnWidth = 1600 - 16 - 320;
    expect(middleOf(rect)).toBe(pageColumnWidth / 2);
  });

  test("with the panel hidden, the page is centered in the whole window", () => {
    makeWindow(1600, 1, true);

    expect(middleOf(getEditorPageRect())).toBe(800);
  });

  test("in a narrow window the page still has room for its arrows on the left", () => {
    makeWindow(PAGE_WITH_ARROWS, 1, false);
    const rect = getEditorPageRect();

    expect(rect.x).toBe(40 + 16 + 1);
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
