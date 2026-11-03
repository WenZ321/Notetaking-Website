import type { Editor } from "@tiptap/core";
import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { undo } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { snapToGraphSquares } from "@/components/NotebookPaperTypes/PaperLogic/GraphPaperSnapping";
import { getWrappedBlockInfo } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetWrappedBlockInfo";
import { startWidthResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartWidthResize";
import {
  makeBlock,
  makeLine,
  makeNewspaper,
  schema,
} from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";
import { makeEditor, makeUpdateAttributes } from "../Helpers/TestEditor";

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
      updateAttributes: makeUpdateAttributes(editor, blockPos),
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
