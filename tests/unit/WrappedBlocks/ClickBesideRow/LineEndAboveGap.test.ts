import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { findLineEndAboveGap } from "@/tiptap/extensions/WrappedBlocks/ClickBesideRow/ClickBesideRowPlugin";
import { makeBlock, makeLine, makeRow, schema } from "../../Helpers/TestPage";

const rowBox = new EventTarget();

// A stand-in for the page where the node at rowPos is drawn as the row box
function makeView(
  nodes: Parameters<typeof schema.nodes.doc.create>[1],
  rowPos: number,
) {
  const doc = schema.nodes.doc.create(null, nodes);
  return {
    state: EditorState.create({ doc }),
    nodeDOM: (pos: number) => (pos === rowPos ? rowBox : null),
  } as unknown as Parameters<typeof findLineEndAboveGap>[0];
}

describe("findLineEndAboveGap", () => {
  it("finds the end of the line above the clicked row", () => {
    const line = makeLine("abc");
    const view = makeView(
      [line, makeRow("left", [makeBlock(200)]), makeLine("")],
      line.nodeSize,
    );
    expect(findLineEndAboveGap(view, rowBox)).toBe(line.nodeSize - 1);
  });

  it("finds nothing for a click on something else", () => {
    const line = makeLine("abc");
    const view = makeView(
      [line, makeRow("left", [makeBlock(200)]), makeLine("")],
      line.nodeSize,
    );
    expect(findLineEndAboveGap(view, new EventTarget())).toBeNull();
  });

  it("finds nothing when no line is above the row", () => {
    const view = makeView([makeRow("left", [makeBlock(200)]), makeLine("")], 0);
    expect(findLineEndAboveGap(view, rowBox)).toBeNull();
  });
});
