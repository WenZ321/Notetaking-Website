import type { Editor } from "@tiptap/core";
import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { undo, undoDepth } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { snapToGraphSquares } from "@/components/NotebookPaperTypes/PaperLogic/GraphPaperSnapping";
import { getWrappedBlockInfo } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetWrappedBlockInfo";
import {
  announceResize,
  createResizeDispatch,
} from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/ResizeSession";
import { startWidthResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartWidthResize";
import { createWrappedBlockLayoutPlugin } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/WrappedBlockLayoutPlugin";
import { createWrappedBlockTextFlowPlugin } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/WrappedBlockTextFlowPlugin";
import {
  getBlockWidths,
  makeBlock,
  makeLine,
  makeNewspaper,
  makeRow,
  schema,
} from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";
import { makeEditor } from "../Helpers/TestEditor";

// Starts resizing the block at blockPos from its right handle
function startRightResize(
  editor: Editor,
  blockPos: number,
  snapBlockSide: SnapBlockSide,
) {
  return startWidthResize(
    {
      editor,
      blockPos,
      snapBlockSide,
      dispatchResize: createResizeDispatch(editor.view),
      direction: "right",
      startWidth: editor.state.doc.nodeAt(blockPos)!.attrs.width,
      limits: { min: 150, max: 816 },
    },
    getWrappedBlockInfo(editor.state, blockPos),
  );
}

describe("resizing a newspaper's block", () => {
  // the undo history groups changes by when they happen
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // a 200 wide block with 200 of text on each side, so it grows 32 before
  // its right text is at its smallest, and snaps 60 past that
  function makeNewspaperEditor() {
    const editor = makeEditor([
      makeNewspaper([makeLine("left")], [makeBlock(200)], [makeLine("right")]),
      makeLine(""),
    ]);
    return { editor, blockPos: getBlockPositions(editor.state.doc)[0] };
  }

  test("one undo after snapping to a page edge brings back the newspaper", () => {
    const { editor, blockPos } = makeNewspaperEditor();
    const newspaperPage = editor.state.doc;

    const session = startRightResize(editor, blockPos, keepLength);
    session.onMove(20, 0);
    session.onMove(150, 0);
    // held snapped a moment before letting go, like a person does
    vi.advanceTimersByTime(1000);
    session.onRelease();
    // the left text went above the row
    expect(editor.state.doc.child(1).attrs.wrap).toBe("right");

    undo(editor.state, editor.view.dispatch);
    expect(editor.state.doc.eq(newspaperPage)).toBe(true);
  });

  test("one undo takes back a resize the row rules fix up when it ends", () => {
    const editor = makeEditor(
      [
        makeNewspaper(
          [makeLine("left")],
          [makeBlock(200)],
          [makeLine("right")],
        ),
        makeLine(""),
      ],
      [createWrappedBlockTextFlowPlugin(), createWrappedBlockLayoutPlugin()],
    );
    const blockPos = getBlockPositions(editor.state.doc)[0];

    // the row rules first make the test row's widths fill the page
    announceResize(editor.view, "end");
    const pageBefore = editor.state.doc;

    vi.advanceTimersByTime(1000);
    announceResize(editor.view, "start");
    const session = startRightResize(editor, blockPos, keepLength);
    session.onMove(20, 0);
    session.onRelease();
    announceResize(editor.view, "end");
    expect(editor.state.doc.eq(pageBefore)).toBe(false);

    undo(editor.state, editor.view.dispatch);
    expect(editor.state.doc.eq(pageBefore)).toBe(true);
  });

  test("snapping to a page edge keeps the row's other blocks", () => {
    const editor = makeEditor([
      makeNewspaper(
        [makeLine("")],
        [makeBlock(200), makeBlock(200)],
        [makeLine("")],
      ),
      makeLine(""),
    ]);
    const blockPos = getBlockPositions(editor.state.doc)[1];

    const session = startRightResize(editor, blockPos, keepLength);
    session.onMove(150, 0);
    session.onRelease();

    const row = editor.state.doc.firstChild!;
    expect(row.attrs.wrap).toBe("right");
    expect(getBlockWidths(row)).toEqual([200, 400]);
  });

  test("snapped to a page edge, the row's blocks leave the text its smallest width", () => {
    const editor = makeEditor([
      makeNewspaper(
        [makeLine("")],
        [makeBlock(400), makeBlock(200)],
        [makeLine("")],
      ),
      makeLine(""),
    ]);
    const blockPos = getBlockPositions(editor.state.doc)[1];

    const session = startRightResize(editor, blockPos, keepLength);
    session.onMove(150, 0);
    session.onRelease();

    expect(getBlockWidths(editor.state.doc.firstChild!)).toEqual([400, 245]);
  });

  test("on graph paper, snapping to a page edge keeps the block in whole squares", () => {
    // a 200 wide block with 168 of text on its left and 448 on its right,
    // so snapped to the right edge it would fill all but the smallest text
    const textColumn = (width: number) =>
      schema.nodes.WrappedColumn.create(
        { columnType: "text", width },
        makeLine(""),
      );
    const newspaper = schema.nodes.WrappedBlock.create({ wrap: "newspaper" }, [
      textColumn(168),
      schema.nodes.WrappedColumn.create(
        { columnType: "block" },
        makeBlock(200),
      ),
      textColumn(448),
    ]);
    const editor = makeEditor([newspaper, makeLine("")]);
    const blockPos = getBlockPositions(editor.state.doc)[0];

    const session = startRightResize(editor, blockPos, snapToGraphSquares);
    session.onMove(400, 0);
    session.onRelease();

    const row = editor.state.doc.firstChild!;
    expect(row.attrs.wrap).toBe("right");
    expect(row.firstChild!.firstChild!.attrs.width).toBe(624);
  });
});

describe("a slow resize is one undo step", () => {
  // the undo history groups changes by when they happen, so a slow drag
  // would be split up if it didn't join its steps itself
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function moveSlowly(editor: Editor, deltas: number[]) {
    const blockPos = getBlockPositions(editor.state.doc)[0];
    const session = startRightResize(editor, blockPos, keepLength);
    for (const delta of deltas) {
      session.onMove(delta, 0);
      vi.advanceTimersByTime(1000);
    }
    session.onRelease();
  }

  test("a floated block's far side", () => {
    const editor = makeEditor([
      makeRow("left", [makeBlock(200)]),
      makeLine(""),
    ]);
    moveSlowly(editor, [20, 40, 60]);
    expect(undoDepth(editor.state)).toBe(1);
  });

  test("a newspaper's block", () => {
    const editor = makeEditor([
      makeNewspaper([makeLine("")], [makeBlock(200)], [makeLine("")]),
      makeLine(""),
    ]);
    moveSlowly(editor, [10, 20, 30]);
    expect(undoDepth(editor.state)).toBe(1);
  });

  test("opening text beside a floated block", () => {
    const editor = makeEditor([
      makeRow("right", [makeBlock(400)]),
      makeLine(""),
    ]);
    const blockPos = getBlockPositions(editor.state.doc)[0];
    const widths: number[] = [];
    const session = startRightResize(editor, blockPos, keepLength);
    for (const delta of [-170, -190, -210]) {
      session.onMove(delta, 0);
      widths.push(editor.state.doc.nodeAt(blockPos)!.attrs.width);
      vi.advanceTimersByTime(1000);
    }

    expect(widths).toEqual([230, 210, 190]);
    expect(undoDepth(editor.state)).toBe(1);
  });
});

describe("resizing the edge between two blocks", () => {
  // tests run without a browser, so there are no drawn blocks to measure
  beforeEach(() => vi.stubGlobal("HTMLElement", class {}));
  afterEach(() => vi.unstubAllGlobals());

  test("one block grows as much as the other shrinks, until the other is at its smallest", () => {
    const editor = makeEditor([
      makeRow("left", [makeBlock(200), makeBlock(300)]),
      makeLine(""),
    ]);
    const [firstPos, secondPos] = getBlockPositions(editor.state.doc);
    const widths = () =>
      [firstPos, secondPos].map(
        (pos) => editor.state.doc.nodeAt(pos)!.attrs.width,
      );

    const session = startRightResize(editor, firstPos, keepLength);
    session.onMove(80, 0);
    expect(widths()).toEqual([280, 220]);

    // the second block stops at the smallest block width, 150
    session.onMove(500, 0);
    expect(widths()).toEqual([350, 150]);
  });
});
