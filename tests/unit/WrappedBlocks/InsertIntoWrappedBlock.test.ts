import type { CommandProps } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type {
  TopLevelNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { insertIntoWrappedBlock } from "@/tiptap/extensions/WrappedBlocks/InsertIntoWrappedBlock";
import {
  getBlockWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
} from "../Helpers/TestPage";
import { describePage, makeState } from "../Helpers/TestDrag";

// A stand-in for something drawn on the page, with its box on screen
class FakeElement {
  constructor(
    private rect: { top: number; bottom: number } | null,
    public firstElementChild: FakeElement | null = null,
  ) {}
  getBoundingClientRect() {
    return this.rect;
  }
}

// The cursor's line is drawn from 50 to 70 down the page
const CURSOR_LINE = { top: 50, bottom: 70 };

// Inserts a 150 wide block with the cursor at cursorPos. The first row on
// the page is drawn rowTop to rowBottom down the page
function insert(
  nodes: TopLevelNode[],
  cursorPos: number,
  rowBox = { top: 0, bottom: 100 },
) {
  const state = makeState(nodes);
  const tr = state.tr.setSelection(TextSelection.create(state.doc, cursorPos));
  const view = {
    coordsAtPos: () => CURSOR_LINE,
    nodeDOM: (pos: number) =>
      pos === 0 ? new FakeElement(null, new FakeElement(rowBox)) : null,
  };
  const props = { tr, editor: { view }, dispatch: () => {} };
  const block = makeBlock(150);
  const isInRow = insertIntoWrappedBlock(
    props as unknown as CommandProps,
    block,
    "blank",
  );
  return { isInRow, tr, block };
}

// The page's row, wherever it sits among the lines
function findRow(tr: Transaction) {
  return tr.doc.content.content.find(
    (node) => node.type.name === "WrappedBlock",
  ) as WrappedBlockNode;
}

beforeEach(() => {
  vi.stubGlobal("HTMLElement", FakeElement);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("insertIntoWrappedBlock in a newspaper", () => {
  const newspaper = () =>
    makeNewspaper([makeLine("left")], [makeBlock(200)], [makeLine("right")]);

  test("in the left text, the block takes its place: the row wraps left with the left text above and the right text below", () => {
    // inside the newspaper, its left column and that column's line
    const { isInRow, tr } = insert([newspaper()], 3);

    expect(isInRow).toBe(true);
    expect(describePage(tr.doc)).toEqual(["left", "row", "right"]);
    expect(findRow(tr).attrs.wrap).toBe("left");
    expect(getBlockWidths(findRow(tr))).toEqual([150, 200]);
  });

  test("in the right text, the row wraps right with the new block on the right end", () => {
    const page = newspaper();
    const rightLinePos = page.nodeSize - 4;
    const { tr } = insert([page], rightLinePos);

    expect(describePage(tr.doc)).toEqual(["left", "row", "right"]);
    expect(findRow(tr).attrs.wrap).toBe("right");
    expect(getBlockWidths(findRow(tr))).toEqual([200, 150]);
  });

  test("the new block ends up selected", () => {
    const { tr } = insert([newspaper()], 3);

    expect(tr.selection).toBeInstanceOf(NodeSelection);
    expect((tr.selection as NodeSelection).node.attrs.width).toBe(150);
  });
});

describe("insertIntoWrappedBlock beside a floated row", () => {
  const page = () => [makeRow("left", [makeBlock(200)]), makeLine("text")];

  test("on a line beside a row wrapped left, the block joins its right end", () => {
    const nodes = page();
    const linePos = nodes[0].nodeSize + 1;
    const { isInRow, tr } = insert(nodes, linePos);

    expect(isInRow).toBe(true);
    expect(getBlockWidths(findRow(tr))).toEqual([200, 150]);
  });

  test("on a line beside a row wrapped right, the block joins its left end", () => {
    const nodes = [makeRow("right", [makeBlock(200)]), makeLine("text")];
    const linePos = nodes[0].nodeSize + 1;
    const { tr } = insert(nodes, linePos);

    expect(getBlockWidths(findRow(tr))).toEqual([150, 200]);
  });

  test("a line only touching the row's bottom edge isn't beside it", () => {
    const nodes = page();
    const linePos = nodes[0].nodeSize + 1;
    // the line's middle, 60, is just past the row's bottom
    const { isInRow, tr } = insert(nodes, linePos, { top: 0, bottom: 60 });

    expect(isInRow).toBe(false);
    expect(getBlockWidths(findRow(tr))).toEqual([200]);
  });

  test("a line before the row isn't beside it, since text wraps after a row", () => {
    const nodes = [makeLine("text"), makeRow("left", [makeBlock(200)])];
    const { isInRow } = insert(nodes, 1);

    expect(isInRow).toBe(false);
  });
});
