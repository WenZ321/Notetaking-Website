import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { describe, expect, it } from "vitest";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { joinBackward } from "@tiptap/pm/commands";
import { createWrappedBlockLayoutPlugin } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/WrappedBlockLayoutPlugin";
import { makeBlock, makeLine, makeRow, schema } from "../Helpers/TestPage";

// Presses backspace at the start of the line between two rows and gives
// back how many blocks each row has afterward
function backspaceBetweenRows(lineText: string): number[] {
  const firstRow = makeRow("left", [makeBlock(200)]);
  const doc = schema.nodes.doc.create(null, [
    firstRow,
    makeLine(lineText),
    makeRow("left", [makeBlock(300)]),
    makeLine(""),
  ]);
  const start = EditorState.create({
    doc,
    plugins: [createWrappedBlockLayoutPlugin()],
  });
  let state = start.apply(
    start.tr.setSelection(TextSelection.create(doc, firstRow.nodeSize + 1)),
  );
  joinBackward(state, (tr) => {
    state = state.apply(tr);
  });
  return countRowBlocks(state.doc);
}

function countRowBlocks(doc: PageNode): number[] {
  const counts: number[] = [];
  doc.forEach((node) => {
    if (node.type.name === "WrappedBlock") counts.push(node.childCount);
  });
  return counts;
}

describe("backspace on the line between two rows", () => {
  it("leaves both rows apart when the line is empty", () => {
    expect(backspaceBetweenRows("")).toEqual([1, 1]);
  });

  it("leaves both rows apart when the line has text", () => {
    expect(backspaceBetweenRows("hello")).toEqual([1, 1]);
  });
});
