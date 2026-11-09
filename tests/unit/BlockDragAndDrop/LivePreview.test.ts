import type { EditorView } from "@tiptap/pm/view";
import type { Transaction } from "@tiptap/pm/state";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { history, undo } from "@tiptap/pm/history";
import { keepLength } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { createBlockDragAndDropPlugin } from "@/tiptap/extensions/BlockDragAndDrop/BlockDragAndDropPlugin";
import {
  blockDragPluginKey,
  getSavableDoc,
  setDragState,
} from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { dropIntoText } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/DropIntoText";
import {
  hideLiveDropPreview,
  showLiveDropPreview,
} from "@/tiptap/extensions/BlockDragAndDrop/LivePreview";
import { makeBlock, makeLine, makeRow, schema } from "../Helpers/TestPage";
import { describePage, getBlockPositions, makeDrag } from "../Helpers/TestDrag";

// A stand-in for the editor, holding a page with undo and block dragging
function makeView(
  takeBackDrop: (stateBefore: EditorState) => void = () => {},
): EditorView {
  const view = {
    state: EditorState.create({
      doc: schema.nodes.doc.create(null, [
        makeRow("left", [makeBlock(200)]),
        makeLine("hello"),
        makeLine("world"),
      ]),
      plugins: [
        history(),
        createBlockDragAndDropPlugin(keepLength, () => {}, takeBackDrop),
      ],
    }),
    dispatch: (tr: Transaction) => {
      view.state = view.state.apply(tr);
    },
    focus: () => {},
  };
  return view as unknown as EditorView;
}

describe("live drop preview", () => {
  test("the page saved during a preview is the real one, with no copy of the block", () => {
    const view = makeView();
    const realPage = view.state.doc;
    const blockPos = getBlockPositions(realPage)[0];
    const drag = makeDrag(view.state, blockPos);
    setDragState(view, drag);

    const target = dropIntoText(drag, { left: 0, top: 130 });
    showLiveDropPreview(view, target!.change!);

    expect(view.state.doc.eq(realPage)).toBe(false);
    expect(getSavableDoc(view.state).eq(realPage)).toBe(true);
  });

  test("showing and taking away a preview leaves the page and undo as they were", () => {
    const view = makeView();

    // types a word at the end of "hello"
    const helloEnd = view.state.doc.child(0).nodeSize + 1 + "hello".length;
    view.dispatch(view.state.tr.insertText(" there", helloEnd));
    const pageBeforeDrag = describePage(view.state.doc);

    const drag = makeDrag(view.state, getBlockPositions(view.state.doc)[0]);
    setDragState(view, drag);
    const target = dropIntoText(drag, { left: 0, top: 135 });
    showLiveDropPreview(view, target!.change!);
    hideLiveDropPreview(view);
    setDragState(view, null);

    expect(describePage(view.state.doc)).toEqual(pageBeforeDrag);

    undo(view.state, view.dispatch);
    expect(describePage(view.state.doc)).toEqual(["row", "hello", "world"]);
  });
});

describe("dropping a block", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Drops the block right after its preview moved, so the preview's own
  // check hasn't run, on a 100 tall page that ends up this tall next frame
  function dropOnPage(bottomNextFrame: number) {
    let nextFrame = () => {};
    vi.stubGlobal("requestAnimationFrame", (run: () => void) => {
      nextFrame = run;
    });

    const takeBackDrop = vi.fn();
    const view = makeView(takeBackDrop);
    const box = { bottom: 50 };
    Object.assign(view, {
      nodeDOM: () => null,
      dom: {
        getBoundingClientRect: () => ({ top: 0, height: 100 }),
        querySelectorAll: () => [{ getBoundingClientRect: () => box }],
      },
    });

    const drag = makeDrag(view.state, getBlockPositions(view.state.doc)[0]);
    const target = dropIntoText(drag, { left: 0, top: 130 });
    setDragState(view, { ...drag, target });
    showLiveDropPreview(view, target!.change!);

    const { handleDrop } = blockDragPluginKey.get(view.state)!.props;
    handleDrop!.call(
      blockDragPluginKey.get(view.state)!,
      view,
      new Event("drop") as DragEvent,
      null!,
      true,
    );

    box.bottom = bottomNextFrame;
    nextFrame();
    return { drag, takeBackDrop };
  }

  test("a drop past the bottom of the page is taken back to before the drag", () => {
    const { drag, takeBackDrop } = dropOnPage(200);

    expect(takeBackDrop).toHaveBeenCalledWith(drag.startState);
  });

  test("a drop that fits stays", () => {
    const { takeBackDrop } = dropOnPage(90);

    expect(takeBackDrop).not.toHaveBeenCalled();
  });
});
