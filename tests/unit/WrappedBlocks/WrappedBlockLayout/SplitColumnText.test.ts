import type { Fragment } from "@tiptap/pm/model";
import { describe, expect, test } from "vitest";
import { Fragment as PMFragment } from "@tiptap/pm/model";
import { splitColumnText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/SplitColumnText";
import { makeLine } from "../../Helpers/TestPage";

// A column's two lines, "abc" then "def". Each line takes its text plus one
// spot at each end, so "def" starts at 5
const lines = PMFragment.fromArray([makeLine("abc"), makeLine("def")]);

// The text of each line
function getLineTexts(fragment: Fragment): string[] {
  const texts: string[] = [];
  fragment.forEach((line) => texts.push(line.textContent));
  return texts;
}

describe("splitColumnText", () => {
  test("a spot between two lines splits them without cutting either", () => {
    const [kept, leaving] = splitColumnText(lines, 5);

    expect(getLineTexts(kept)).toEqual(["abc"]);
    expect(getLineTexts(leaving)).toEqual(["def"]);
  });

  test("a spot inside the first line cuts it in two, losing no letters", () => {
    const [kept, leaving] = splitColumnText(lines, 2);

    expect(getLineTexts(kept)).toEqual(["a"]);
    expect(getLineTexts(leaving)).toEqual(["bc", "def"]);
  });

  test("a spot inside the last line cuts only that line", () => {
    const [kept, leaving] = splitColumnText(lines, 8);

    expect(getLineTexts(kept)).toEqual(["abc", "de"]);
    expect(getLineTexts(leaving)).toEqual(["f"]);
  });
});
