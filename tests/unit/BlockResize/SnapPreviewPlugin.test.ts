import type { EditorState } from "@tiptap/pm/state";
import type { DecorationSet } from "@tiptap/pm/view";
import { describe, expect, test } from "vitest";
import {
  createSnapPreviewPlugin,
  setSnapPreview,
} from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/SnapPreviewPlugin";
import { BLOCK_RESIZE_META } from "@/tiptap/TransactionBehavior";
import { makeEditor } from "../Helpers/TestEditor";
import { makeBlock, makeLine, makeRow } from "../Helpers/TestPage";

const plugin = createSnapPreviewPlugin();

// A page with a line and then a row, with the snap preview plugin
function makePage() {
  const line = makeLine("a");
  const editor = makeEditor(
    [line, makeRow("left", [makeBlock(200)])],
    [plugin],
  );
  return { editor, rowPos: line.nodeSize };
}

// Where the preview is drawn and the HTML attributes it gives the row.
// A row's decoration keeps its HTML attributes on its type
type RowDecoration = {
  from: number;
  type: { attrs: Record<string, string> };
};
function readPreview(state: EditorState) {
  const decorations = plugin.props.decorations!.call(plugin, state) as
    | DecorationSet
    | null;
  const decoration = decorations?.find()[0] as RowDecoration | undefined;
  return decoration ? { from: decoration.from, ...decoration.type.attrs } : null;
}

describe("the snap preview", () => {
  test("marks the row with the side it snaps to", () => {
    const { editor, rowPos } = makePage();

    setSnapPreview(editor.view, { wrappedBlockPos: rowPos, side: "right" });

    expect(readPreview(editor.state)).toEqual({
      from: rowPos,
      "data-snap": "right",
    });
  });

  test("a row becoming a newspaper also gets its left text's width", () => {
    const { editor, rowPos } = makePage();

    setSnapPreview(editor.view, {
      wrappedBlockPos: rowPos,
      side: "newspaper",
      leftTextWidth: 120,
    });

    expect(readPreview(editor.state)).toMatchObject({
      "data-snap": "newspaper",
      style: "--snap-left-text: 120px",
    });
  });

  test("follows the row when text before it changes", () => {
    const { editor, rowPos } = makePage();
    setSnapPreview(editor.view, { wrappedBlockPos: rowPos, side: "right" });

    editor.view.dispatch(editor.state.tr.insertText("bc", 1));

    expect(readPreview(editor.state)?.from).toBe(rowPos + 2);
  });

  test("goes away when set to null, or when a resize starts or ends", () => {
    const { editor, rowPos } = makePage();
    const show = () =>
      setSnapPreview(editor.view, { wrappedBlockPos: rowPos, side: "right" });

    show();
    setSnapPreview(editor.view, null);
    expect(readPreview(editor.state)).toBeNull();

    show();
    editor.view.dispatch(editor.state.tr.setMeta(BLOCK_RESIZE_META, "end"));
    expect(readPreview(editor.state)).toBeNull();
  });
});
