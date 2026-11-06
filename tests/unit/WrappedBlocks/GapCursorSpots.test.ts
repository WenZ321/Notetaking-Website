import type { ResolvedPos } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { makeBlock, makeLine, makeRow, schema } from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";

// Whether the gap cursor can sit at a spot, which its types leave out
const isValidSpot = (
  GapCursor as unknown as {
    valid: ($pos: ResolvedPos) => boolean;
  }
).valid;

const firstRow = makeRow("left", [makeBlock(200)]);
const doc = schema.nodes.doc.create(null, [
  firstRow,
  makeRow("left", [makeBlock(200)]),
  makeLine(""),
]);

describe("where the horizontal gap cursor can go", () => {
  it("can't go beside a block inside its column", () => {
    const blockPos = getBlockPositions(doc)[0];
    expect(isValidSpot(doc.resolve(blockPos))).toBe(false);
    expect(isValidSpot(doc.resolve(blockPos + 1))).toBe(false);
  });

  it("can go between two rows that touch, to add a line there", () => {
    expect(isValidSpot(doc.resolve(firstRow.nodeSize))).toBe(true);
  });
});
