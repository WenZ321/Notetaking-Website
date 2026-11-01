import { describe, expect, test } from "vitest";
import {
  fitSpineTitle,
  getSpineTitleColor,
} from "@/components/3DScene/Bookshelf/SpineTitleFit";
import {
  SPINE_TITLE_DARK,
  SPINE_TITLE_LIGHT,
  SPINE_TITLE_SIZE,
  SPINE_TITLE_SMALLEST_SIZE,
} from "@/components/3DScene/Bookshelf/BookshelfLook";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";

describe("fitSpineTitle", () => {
  test("a short title keeps its full text at the usual size", () => {
    expect(fitSpineTitle("Physics")).toEqual({
      text: "Physics",
      size: SPINE_TITLE_SIZE,
    });
  });

  test("a longer title shrinks to fit instead of being cut off", () => {
    const title = "Organic Chemistry Lab";
    const fitted = fitSpineTitle(title);

    expect(fitted.text).toBe(title);
    expect(fitted.size).toBeLessThan(SPINE_TITLE_SIZE);
    expect(fitted.size).toBeGreaterThanOrEqual(SPINE_TITLE_SMALLEST_SIZE);
  });

  test("a title too long even at the smallest size is cut off with …", () => {
    const title = "Introduction to Linear Algebra and Differential Equations";
    const fitted = fitSpineTitle(title);

    expect(fitted.size).toBe(SPINE_TITLE_SMALLEST_SIZE);
    expect(fitted.text.endsWith("…")).toBe(true);
    expect(fitted.text.length).toBeLessThan(title.length);
    expect(title.startsWith(fitted.text.slice(0, -1))).toBe(true);
  });
});

describe("getSpineTitleColor", () => {
  test("light covers get dark titles and dark covers get light ones", () => {
    const spine = (style: keyof typeof NOTEBOOK_COVER_STYLES) =>
      NOTEBOOK_COVER_STYLES[style].colors.spine;

    expect(getSpineTitleColor(spine("yellow"))).toBe(SPINE_TITLE_DARK);
    expect(getSpineTitleColor(spine("mint"))).toBe(SPINE_TITLE_DARK);
    expect(getSpineTitleColor(spine("blue"))).toBe(SPINE_TITLE_LIGHT);
    expect(getSpineTitleColor(spine("red"))).toBe(SPINE_TITLE_LIGHT);
  });
});
