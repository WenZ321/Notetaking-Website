import { describe, expect, test } from "vitest";
import { undoDepth } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { startHeightResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartHeightResize";
import { makeBlock, makeRow } from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";
import { makeEditor } from "../Helpers/TestEditor";

describe("startHeightResize", () => {
  test("a whole resize is one undo step, however many times it moves", () => {
    const editor = makeEditor([makeRow("left", [makeBlock(200)])]);
    const blockPos = getBlockPositions(editor.state.doc)[0];
    const session = startHeightResize(
      {
        editor,
        blockPos,
        snapBlockSide: keepLength,
        updateAttributes: () => {},
      },
      100,
      { min: 24, max: 600 },
      [blockPos],
    );

    session.onMove(0, 10);
    session.onMove(0, 20);
    session.onMove(0, 30);

    expect(editor.state.doc.nodeAt(blockPos)!.attrs.height).toBe(130);
    expect(undoDepth(editor.state)).toBe(1);
  });
});
