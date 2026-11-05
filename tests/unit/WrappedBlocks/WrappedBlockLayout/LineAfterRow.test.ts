import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { createWrappedBlockLayoutPlugin } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/WrappedBlockLayoutPlugin";
import {
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
  schema,
} from "../../Helpers/TestPage";

// Deletes the line at an index of the page and gives back the page's nodes
// once the layout rules have run
function deleteLine(nodes: PageNode[], lineIndex: number): string[] {
  const doc = schema.nodes.doc.create(null, nodes);
  const state = EditorState.create({
    doc,
    plugins: [createWrappedBlockLayoutPlugin()],
  });

  let linePos = 0;
  for (let i = 0; i < lineIndex; i++) linePos += doc.child(i).nodeSize;
  const tr = state.tr.delete(linePos, linePos + doc.child(lineIndex).nodeSize);

  const names: string[] = [];
  state.applyTransaction(tr).state.doc.forEach((node) => {
    names.push(node.type.name);
  });
  return names;
}

const newspaper = () =>
  makeNewspaper([makeLine("")], [makeBlock(200)], [makeLine("")]);
const floatedRow = () => makeRow("left", [makeBlock(200)]);

describe("the line after a row", () => {
  it("can be deleted between a newspaper and the next row", () => {
    const page = [newspaper(), makeLine(""), floatedRow(), makeLine("")];
    expect(deleteLine(page, 1)).toEqual([
      "WrappedBlock",
      "WrappedBlock",
      "paragraph",
    ]);
  });

  it("comes back after a floated row, since its text is that line", () => {
    const page = [floatedRow(), makeLine(""), floatedRow(), makeLine("")];
    expect(deleteLine(page, 1)).toEqual([
      "WrappedBlock",
      "paragraph",
      "WrappedBlock",
      "paragraph",
    ]);
  });

  it("comes back after the page's last row", () => {
    expect(deleteLine([newspaper(), makeLine("")], 1)).toEqual([
      "WrappedBlock",
      "paragraph",
    ]);
  });
});
