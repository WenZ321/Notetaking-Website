import type { EditorView } from "@tiptap/pm/view";
import { describe, expect, it, vi } from "vitest";
import { Fragment, Slice } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { history, undo } from "@tiptap/pm/history";
import {
  PAGE_FULL_MESSAGE,
  keepWithinPage,
} from "@/tiptap/extensions/PageFull/PageFit";
import {
  PASTE_CUT_MESSAGE,
  cutPaste,
  getPasteCutSpots,
  pasteWhatFits,
} from "@/tiptap/extensions/PageFull/PasteWhatFits";
import { makeBlock, makeLine, makeRow, schema } from "../Helpers/TestPage";

// A stand-in for the page where every character is one pixel tall, so the
// content's bottom is how much text there is
function makePage(text: string, pageHeight: number) {
  const doc = schema.nodes.doc.create(null, makeLine(text));
  const view = {
    state: EditorState.create({ doc, plugins: [history()] }),
    updateState: (state: EditorState) => {
      view.state = state;
    },
    dispatch: (tr: Parameters<EditorState["apply"]>[0]) => {
      view.updateState(view.state.apply(tr));
    },
    dom: {
      querySelectorAll: () => [
        {
          getBoundingClientRect: () => ({
            bottom: view.state.doc.textContent.length,
          }),
        },
      ],
      getBoundingClientRect: () => ({ top: 0, height: pageHeight }),
    },
  };
  return view as unknown as EditorView;
}

function moveCursorToEnd(view: EditorView) {
  const end = view.state.doc.content.size - 1;
  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, end)),
  );
}

function typeText(view: EditorView, text: string, onPageFull = vi.fn()) {
  const next = (tr: Parameters<EditorView["dispatch"]>[0]) => view.dispatch(tr);
  keepWithinPage(view, view.state.tr.insertText(text), next, onPageFull);
  return onPageFull;
}

function makePaste(text: string) {
  return new Slice(Fragment.from(makeLine(text)), 1, 1);
}

describe("keepWithinPage", () => {
  it("keeps an edit that fits", () => {
    const view = makePage("abc", 100);
    moveCursorToEnd(view);
    const onPageFull = typeText(view, "d");
    expect(view.state.doc.textContent).toBe("abcd");
    expect(onPageFull).not.toHaveBeenCalled();
  });

  it("takes back an edit past the bottom and says the page is full", () => {
    const view = makePage("abc", 3);
    moveCursorToEnd(view);
    const onPageFull = typeText(view, "de");
    expect(view.state.doc.textContent).toBe("abc");
    expect(onPageFull).toHaveBeenCalledWith(PAGE_FULL_MESSAGE);
  });

  it("leaves nothing in undo after a refused edit", () => {
    const view = makePage("abc", 4);
    moveCursorToEnd(view);
    typeText(view, "d");
    typeText(view, "efg");
    undo(view.state, view.dispatch);
    expect(view.state.doc.textContent).toBe("abc");
  });

  it("lets a page already past the bottom get shorter", () => {
    const view = makePage("abcdefgh", 3);
    const onPageFull = vi.fn();
    const next = (tr: Parameters<EditorView["dispatch"]>[0]) =>
      view.dispatch(tr);
    keepWithinPage(view, view.state.tr.delete(1, 3), next, onPageFull);
    expect(view.state.doc.textContent).toBe("cdefgh");
    expect(onPageFull).not.toHaveBeenCalled();
  });
});

describe("getPasteCutSpots", () => {
  it("has a spot after every word, and none inside one", () => {
    const content = Fragment.from(makeLine("ab  cd"));
    expect(getPasteCutSpots(content)).toEqual([3, 7]);
  });

  it("counts a row as one spot that can't be split", () => {
    const row = makeRow("left", [makeBlock(200)]);
    const content = Fragment.fromArray([makeLine("ab"), row]);
    expect(getPasteCutSpots(content)).toEqual([3, 4 + row.nodeSize]);
  });
});

describe("cutPaste", () => {
  it("keeps a short paste open so it joins the cursor's line", () => {
    const part = cutPaste(makePaste("ab cd"), 3);
    expect(part.content.textBetween(0, part.content.size)).toBe("ab");
    expect([part.openStart, part.openEnd]).toEqual([1, 1]);
  });
});

describe("pasteWhatFits", () => {
  it("leaves a paste that fits to the normal paste", () => {
    const view = makePage("", 100);
    const onPageFull = vi.fn();
    expect(pasteWhatFits(view, makePaste("one two"), onPageFull)).toBe(false);
    expect(view.state.doc.textContent).toBe("");
    expect(onPageFull).not.toHaveBeenCalled();
  });

  it("pastes the words that fit and says the rest didn't", () => {
    const view = makePage("", 9);
    const onPageFull = vi.fn();
    const isHandled = pasteWhatFits(
      view,
      makePaste("one two three four"),
      onPageFull,
    );
    expect(isHandled).toBe(true);
    expect(view.state.doc.textContent).toBe("one two");
    expect(onPageFull).toHaveBeenCalledWith(PASTE_CUT_MESSAGE);
  });

  it("pastes nothing when not even a word fits", () => {
    const view = makePage("abc", 4);
    moveCursorToEnd(view);
    const onPageFull = vi.fn();
    pasteWhatFits(view, makePaste("hello"), onPageFull);
    expect(view.state.doc.textContent).toBe("abc");
    expect(onPageFull).toHaveBeenCalledWith(PAGE_FULL_MESSAGE);
  });
});
