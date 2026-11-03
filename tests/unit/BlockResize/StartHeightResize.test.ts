import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { describe, expect, test } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { history, undoDepth } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { startHeightResize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/ResizeCases/StartHeightResize";
import { makeBlock, makeRow, schema } from "../Helpers/TestPage";
import { getBlockPositions } from "../Helpers/TestDrag";

// A stand-in for the editor, holding one block in a row, with undo
function makeEditor(): Editor {
  const view = {
    state: EditorState.create({
      doc: schema.nodes.doc.create(null, [makeRow("left", [makeBlock(200)])]),
      plugins: [history()],
    }),
    dispatch: (tr: Transaction) => {
      view.state = view.state.apply(tr);
    },
  };
  return {
    view,
    get state() {
      return view.state;
    },
  } as unknown as Editor;
}

describe("startHeightResize", () => {
  test("a whole resize is one undo step, however many times it moves", () => {
    const editor = makeEditor();
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
