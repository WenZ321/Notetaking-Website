import type {
  CustomBlockNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { ActiveDrag } from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import type { MeasuredRow } from "@/tiptap/extensions/BlockDragAndDrop/DragUtils";
import { describe, expect, test } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import {
  buildOwnWrappedBlockMove,
  reorderOwnRow,
} from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import {
  HOME_TARGET,
  replaceStretch,
} from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import {
  getBlockWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
  schema,
} from "../Helpers/TestPage";

// Content that needs no room, so only the block's own smallest size counts
const NO_CONTENT_MIN = { width: 0, height: 0 };

// A page holding just the row, and where each of its blocks starts
function makePage(row: WrappedBlockNode) {
  const doc = schema.nodes.doc.create(null, [row, makeLine("")]);
  const blockPositions: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "TestBlock") blockPositions.push(pos);
  });
  return { state: EditorState.create({ doc }), blockPositions };
}

// The row as the drag measured it, each block as wide on screen as its width
function measureRow(
  state: EditorState,
  blockPositions: number[],
): MeasuredRow {
  const row = state.doc.firstChild!;
  let left = 0;
  const blocks = blockPositions.map((pos) => {
    const right = left + state.doc.nodeAt(pos)!.attrs.width;
    const block = { pos, left, right, minSize: NO_CONTENT_MIN };
    left = right;
    return block;
  });
  return {
    start: 0,
    end: row.nodeSize,
    wrap: row.attrs.wrap,
    isOwn: true,
    top: 0,
    bottom: 100,
    blocks,
  };
}

// Drags the first block of the row to the cursor
function dragFirstBlockTo(row: WrappedBlockNode, cursorLeft: number) {
  const { state, blockPositions } = makePage(row);
  const measured = measureRow(state, blockPositions);
  const from = blockPositions[0];
  const drag: ActiveDrag = {
    startState: state,
    startFrom: from,
    from,
    block: state.doc.nodeAt(from) as CustomBlockNode,
    blockMinSize: NO_CONTENT_MIN,
    grabOffsetX: 0,
    page: { width: 800, rows: [measured], lines: [] },
    target: null,
    preview: null,
  };
  const target = reorderOwnRow(drag, measured, { left: cursorLeft, top: 50 });
  return { state, target };
}

// Drops the first block at the cursor, returning the new row and the block
// where the drop says the dragged one landed
function dropFirstBlockAt(row: WrappedBlockNode, cursorLeft: number) {
  const { state, target } = dragFirstBlockTo(row, cursorLeft);
  const change = target.change!;

  const tr = state.tr;
  replaceStretch(tr, change, change.start, change.end);
  return {
    row: tr.doc.firstChild as WrappedBlockNode,
    droppedBlock: tr.doc.nodeAt(change.start + change.blockOffset)!,
  };
}

describe("reorderOwnRow", () => {
  test("dragging a block past its neighbor's middle swaps them, and both stay", () => {
    // blocks of 200 and 300, so the second one's middle is at 350
    const row = makeRow("left", [makeBlock(200), makeBlock(300)]);
    const result = dropFirstBlockAt(row, 400);

    expect(getBlockWidths(result.row)).toEqual([300, 200]);
    expect(result.droppedBlock.attrs.width).toBe(200);
  });

  test("dropping a block back in its own gap changes nothing", () => {
    const row = makeRow("left", [makeBlock(200), makeBlock(300)]);
    const { target } = dragFirstBlockTo(row, 100);

    expect(target).toBe(HOME_TARGET);
  });

  test("swapping a newspaper's blocks keeps its text on both sides", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200), makeBlock(300)],
      [makeLine("right text")],
    );
    const result = dropFirstBlockAt(newspaper, 400);
    const columns = result.row.content.content;

    expect(getBlockWidths(result.row)).toEqual([300, 200]);
    expect(isTextColumn(columns[0])).toBe(true);
    expect(columns[0].textContent).toBe("left text");
    expect(columns[3].textContent).toBe("right text");
  });
});

describe("buildOwnWrappedBlockMove", () => {
  test("a newspaper wrapped to a side moves its left text above and its right text below", () => {
    const newspaper = makeNewspaper(
      [makeLine("left text")],
      [makeBlock(200)],
      [makeLine("right text")],
    );
    const { state, blockPositions } = makePage(newspaper);
    const change = buildOwnWrappedBlockMove(state, blockPositions[0], {
      wrap: "left",
      leftTextWidth: null,
    })!;

    const tr = state.tr;
    replaceStretch(tr, change, change.start, change.end);
    const [above, row, below] = tr.doc.content.content;

    expect(above.textContent).toBe("left text");
    expect(row.attrs.wrap).toBe("left");
    expect(row.childCount).toBe(1);
    expect(getBlockWidths(row)).toEqual([200]);
    expect(below.textContent).toBe("right text");
    expect(tr.doc.nodeAt(change.start + change.blockOffset)!.attrs.width).toBe(
      200,
    );
  });
});
