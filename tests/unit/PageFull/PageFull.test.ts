import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Fragment, Slice } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { history, undo } from "@tiptap/pm/history";
import {
  PAGE_FULL_MESSAGE,
  isPastPage,
  keepWithinPage,
  readRoomLeft,
} from "@/tiptap/extensions/PageFull/PageFit";
import {
  PASTE_CUT_MESSAGE,
  cutPaste,
  getPastedBlocksHeight,
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

// Makes a change through the page check
function makeChange(
  view: EditorView,
  tr: Transaction,
  onPageFull: (message: string) => void,
) {
  const editor = { view, storage: { pageFull: { onPageFull } } };
  keepWithinPage(editor as unknown as Editor, tr, (change) =>
    view.dispatch(change),
  );
}

function typeText(view: EditorView, text: string, onPageFull = vi.fn()) {
  makeChange(view, view.state.tr.insertText(text), onPageFull);
  return onPageFull;
}

function makePaste(text: string) {
  return new Slice(Fragment.from(makeLine(text)), 1, 1);
}

describe("readRoomLeft", () => {
  it("is the space under what's on the page", () => {
    expect(readRoomLeft(makePage("abc", 10))).toBe(7);
  });

  it("goes below zero on a page past the bottom", () => {
    const view = makePage("abcdef", 4);
    expect(readRoomLeft(view)).toBe(-2);
    expect(isPastPage(view)).toBe(true);
  });
});

// A stand-in for a 100 tall page where the row ends at the very bottom and
// each line after it goes 12 further
function makePageAfterRow(lines: string[]) {
  const nodes = [makeRow("left", [makeBlock(200)]), ...lines.map(makeLine)];
  const doc = schema.nodes.doc.create(null, nodes);
  const lineBoxes = lines.map((_, index) => ({
    getBoundingClientRect: () => ({ bottom: 100 + 12 * (index + 1) }),
  }));
  const rowBox = { getBoundingClientRect: () => ({ bottom: 100 }) };
  return {
    state: EditorState.create({ doc }),
    nodeDOM: () => lineBoxes.at(-1),
    dom: {
      querySelectorAll: () => [rowBox, ...lineBoxes],
      getBoundingClientRect: () => ({ top: 0, height: 100 }),
    },
  } as unknown as EditorView;
}

describe("the line a row needs under it", () => {
  it("doesn't count when it's empty, so a row can reach the bottom", () => {
    expect(readRoomLeft(makePageAfterRow([""]))).toBe(0);
  });

  it("counts once it has text", () => {
    expect(readRoomLeft(makePageAfterRow(["abc"]))).toBe(-12);
  });

  it("counts when another empty line follows it, so Enter can't hide lines", () => {
    expect(readRoomLeft(makePageAfterRow(["", ""]))).toBe(-24);
  });
});

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
    makeChange(view, view.state.tr.delete(1, 3), onPageFull);
    expect(view.state.doc.textContent).toBe("cdefgh");
    expect(onPageFull).not.toHaveBeenCalled();
  });
});

// A stand-in for a page where every character is one pixel tall and every
// row is ROW_TALL, so a new row is only measured once it's drawn
const ROW_TALL = 50;
function makePageWithRows(text: string, pageHeight: number) {
  const view = makePage(text, pageHeight) as unknown as {
    state: EditorState;
    nodeDOM: () => null;
    dom: { querySelectorAll: () => unknown[] };
  };
  view.nodeDOM = () => null;
  view.dom.querySelectorAll = () => {
    let rows = 0;
    view.state.doc.forEach((node) => {
      if (node.type.name === "WrappedBlock") rows++;
    });
    const bottom = view.state.doc.textContent.length + rows * ROW_TALL;
    return [{ getBoundingClientRect: () => ({ bottom }) }];
  };
  return view as unknown as EditorView;
}

describe("keepWithinPage for a new block", () => {
  // the frame a new block is measured on, run when the test says
  let nextFrame: (() => void) | null = null;
  afterEach(() => {
    vi.unstubAllGlobals();
    nextFrame = null;
  });

  function insertRow(view: EditorView, onPageFull: (message: string) => void) {
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      nextFrame = callback;
    });
    const emit = vi.fn();
    const editor = { view, emit, storage: { pageFull: { onPageFull } } };
    const end = view.state.doc.content.size;
    const tr = view.state.tr.insert(end, makeRow("left", [makeBlock(200)]));
    keepWithinPage(editor as unknown as Editor, tr, (change) =>
      view.dispatch(change),
    );
    return emit;
  }

  it("keeps a block that fits once it's measured", () => {
    const view = makePageWithRows("abc", 100);
    const onPageFull = vi.fn();
    insertRow(view, onPageFull);
    nextFrame!();

    expect(view.state.doc.childCount).toBe(2);
    expect(onPageFull).not.toHaveBeenCalled();
  });

  it("takes back a block past the bottom on the next frame, and says the page is full", () => {
    const view = makePageWithRows("abc", 20);
    const onPageFull = vi.fn();
    const emit = insertRow(view, onPageFull);

    // it shows until it can be measured
    expect(view.state.doc.childCount).toBe(2);
    nextFrame!();

    expect(view.state.doc.childCount).toBe(1);
    expect(onPageFull).toHaveBeenCalledWith(PAGE_FULL_MESSAGE);
    // the page was saved with the block, so it's marked changed to save again
    expect(emit).toHaveBeenCalledWith("update", expect.anything());
  });

  it("leaves a block on a page that was already past the bottom", () => {
    const view = makePageWithRows("abcdefgh", 3);
    const onPageFull = vi.fn();
    insertRow(view, onPageFull);
    nextFrame!();

    expect(view.state.doc.childCount).toBe(2);
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

describe("getPastedBlocksHeight", () => {
  it("counts a row by its tallest block, and rows one after another", () => {
    const content = Fragment.fromArray([
      makeRow("left", [makeBlock(200, 100), makeBlock(200, 150)]),
      makeLine("text"),
      makeRow("left", [makeBlock(200, 50)]),
    ]);
    expect(getPastedBlocksHeight(content)).toBe(200);
  });

  it("counts a block on its own", () => {
    expect(getPastedBlocksHeight(Fragment.from(makeBlock(200, 80)))).toBe(80);
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

  it("stops before a block that doesn't fit, and drops what's after it", () => {
    const view = makePage("", 50);
    const paste = new Slice(
      Fragment.fromArray([
        makeLine("one"),
        makeRow("left", [makeBlock(200, 100)]),
        makeLine("two"),
      ]),
      1,
      1,
    );
    pasteWhatFits(view, paste, vi.fn());
    expect(view.state.doc.textContent).toBe("one");
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
