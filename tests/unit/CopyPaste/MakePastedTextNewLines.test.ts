import { describe, expect, test } from "vitest";
import { Fragment, Slice } from "@tiptap/pm/model";
import { makePastedTextNewLines } from "@/tiptap/extensions/CopyPaste/MakePastedTextNewLines";
import { makeBlock, makeLine, makeRow, schema } from "../Helpers/TestPage";

describe("makePastedTextNewLines", () => {
  test("a pasted cut-off line becomes a new line, and pasted rows are kept as they are", () => {
    const cutOffLine = schema.nodes.paragraph.create(
      { isNewLine: false },
      schema.text("tail"),
    );
    const row = makeRow("left", [makeBlock(200)]);
    const pasted = new Slice(
      Fragment.fromArray([cutOffLine, makeLine("next"), row]),
      0,
      0,
    );

    const result = makePastedTextNewLines(pasted).content;

    expect(result.child(0).attrs.isNewLine).toBe(true);
    expect(result.child(0).textContent).toBe("tail");
    expect(result.child(1).attrs.isNewLine).toBe(true);
    expect(result.child(2)).toBe(row);
  });
});
