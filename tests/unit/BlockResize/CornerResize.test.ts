import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { undoDepth } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { getWrappedBlockInfo } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetWrappedBlockInfo";
import {
  createResizeDispatch,
  joinResizes,
} from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/ResizeSession";
import { startHeightResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartHeightResize";
import { startWidthResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartWidthResize";
import { makeBlock, makeRow } from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";
import { makeEditor } from "../Helpers/TestEditor";

describe("resizing from a bottom corner", () => {
  // the undo history groups changes by when they happen
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("changes the width and the height together, as one undo step", () => {
    const editor = makeEditor([makeRow("left", [makeBlock(200)])]);
    const blockPos = getBlockPositions(editor.state.doc)[0];
    const block = editor.state.doc.nodeAt(blockPos)!;
    const start = {
      editor,
      blockPos,
      snapBlockSide: keepLength,
      dispatchResize: createResizeDispatch(editor.view),
    };
    const session = joinResizes(
      startWidthResize(
        {
          ...start,
          direction: "right",
          startWidth: block.attrs.width,
          limits: { min: 150, max: 816 },
        },
        getWrappedBlockInfo(editor.state, blockPos),
      ),
      startHeightResize(start, block.attrs.height, { min: 24, max: 600 }, [
        blockPos,
      ]),
    );

    // the height moves first, and the width only a while later
    session.onMove(0, 20);
    vi.advanceTimersByTime(1000);
    session.onMove(30, 20);
    session.onRelease();

    const resized = editor.state.doc.nodeAt(blockPos)!;
    expect(resized.attrs.width).toBe(block.attrs.width + 30);
    expect(resized.attrs.height).toBe(block.attrs.height + 20);
    expect(undoDepth(editor.state)).toBe(1);
  });
});
