import { describe, expect, test } from "vitest";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { makeBlock, makeLine, makeNewspaper, schema } from "../../Helpers/TestPage";
import { makeState } from "../../Helpers/TestDrag";

// A line cut off from the line before it, waiting to be joined back
function makeCutOffLine(text: string) {
  return schema.nodes.paragraph.create({ isNewLine: false }, schema.text(text));
}

describe("makeLinesNewAfterDrop", () => {
  test("lines in the rebuilt row and the line right after it become new lines, and lines further down don't", () => {
    const state = makeState([
      makeNewspaper([makeLine("left")], [makeBlock(200)], [makeCutOffLine("right")]),
      makeCutOffLine("waiting"),
      makeCutOffLine("further"),
    ]);

    const tr = state.tr;
    makeLinesNewAfterDrop(tr, 0);

    const lines: string[] = [];
    tr.doc.descendants((node) => {
      if (node.type.name === "paragraph") {
        lines.push(`${node.textContent} ${node.attrs.isNewLine}`);
      }
    });
    expect(lines).toEqual([
      "left true",
      "right true",
      "waiting true",
      "further false",
    ]);
  });
});
