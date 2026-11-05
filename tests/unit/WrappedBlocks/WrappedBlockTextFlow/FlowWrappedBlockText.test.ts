import type { EditorView } from "@tiptap/pm/view";
import type { Transaction } from "@tiptap/pm/state";
import type { PageNode, TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import {
  makeBlock,
  makeLine,
  makeNewspaper,
  schema,
} from "../../Helpers/TestPage";

// How the stand-in page draws text: 10 tall lines of 3 characters each,
// beside blocks 20 tall, so two lines fit
const LINE_HEIGHT = 10;
const LINE_LENGTH = 3;
const BLOCK_HEIGHT = 20;

// A stand-in for a drawn block
class DrawnElement {
  getBoundingClientRect() {
    return { bottom: BLOCK_HEIGHT, height: BLOCK_HEIGHT };
  }
}

// How many drawn lines a line of text takes up
function countDrawnLines(line: PageNode): number {
  return Math.max(1, Math.ceil(line.content.size / LINE_LENGTH));
}

// A stand-in for the editor that draws each column from the top down
function makeView(nodes: TopLevelNode[]): EditorView {
  const view = {
    state: EditorState.create({ doc: schema.nodes.doc.create(null, nodes) }),
    dispatch: (tr: Transaction) => {
      view.state = view.state.apply(tr);
    },
    nodeDOM: () => new DrawnElement(),
    coordsAtPos: (pos: number) => {
      const $pos = view.state.doc.resolve(pos);
      const column = $pos.node(-1);
      let drawnLines = Math.floor($pos.parentOffset / LINE_LENGTH);
      for (let i = 0; i < $pos.index(-1); i++) {
        drawnLines += countDrawnLines(column.child(i));
      }
      return { bottom: (drawnLines + 1) * LINE_HEIGHT };
    },
  };
  return view as unknown as EditorView;
}

function makePage(leftLines: string[], rightLines: string[]) {
  return makeView([
    makeNewspaper(
      leftLines.map(makeLine),
      [makeBlock(200)],
      rightLines.map(makeLine),
    ),
    makeLine("below"),
  ]);
}

// The text of a column's lines
function readColumn(view: EditorView, index: number): string[] {
  const row = view.state.doc.firstChild!;
  return row.child(index).content.content.map((line) => line.textContent);
}

// The lines under the row
function readBelow(view: EditorView): string[] {
  return view.state.doc.content.content
    .slice(1)
    .map((line) => line.textContent);
}

describe("flowWrappedBlockText", () => {
  beforeEach(() => vi.stubGlobal("HTMLElement", DrawnElement));
  afterEach(() => vi.unstubAllGlobals());

  it("leaves text that fits beside the blocks", () => {
    const view = makePage(["a", "b"], ["c"]);
    const pageBefore = view.state.doc;

    flowWrappedBlockText(view, 0);

    expect(view.state.doc.eq(pageBefore)).toBe(true);
  });

  it("pushes extra lines from the left text to the right text", () => {
    const view = makePage(["a", "b", "c"], ["d"]);

    flowWrappedBlockText(view, 0);

    expect(readColumn(view, 0)).toEqual(["a", "b"]);
    expect(readColumn(view, 2)).toEqual(["c", "d"]);
    expect(readBelow(view)).toEqual(["below"]);
  });

  it("pushes the right text's extra lines under the row, losing no words", () => {
    const view = makePage(["a", "b", "c", "d"], ["e"]);

    flowWrappedBlockText(view, 0);

    expect(readColumn(view, 0)).toEqual(["a", "b"]);
    expect(readColumn(view, 2)).toEqual(["c", "d"]);
    expect(readBelow(view)).toEqual(["e", "below"]);
  });

  it("cuts a line that reaches past the blocks, marking its end as cut off", () => {
    const view = makePage(["abcdefgh"], ["x"]);

    flowWrappedBlockText(view, 0);

    expect(readColumn(view, 0)).toEqual(["abcdef"]);
    expect(readColumn(view, 2)).toEqual(["gh", "x"]);
    const cutOffEnd = view.state.doc.firstChild!.lastChild!.firstChild!;
    expect(cutOffEnd.attrs.isNewLine).toBe(false);
  });

  it("keeps the cursor on its text when the text moves", () => {
    const view = makePage(["a", "b", "c"], ["d"]);
    const row = view.state.doc.firstChild!;
    const cursorInC = 1 + 1 + row.firstChild!.child(0).nodeSize * 2 + 2;
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, cursorInC),
      ),
    );
    expect(view.state.selection.$head.parent.textContent).toBe("c");

    flowWrappedBlockText(view, 0);

    expect(view.state.selection.$head.parent.textContent).toBe("c");
  });

  it("stops at a row that isn't a newspaper", () => {
    const view = makeView([makeLine("a")]);
    const pageBefore = view.state.doc;

    flowWrappedBlockText(view, 0);

    expect(view.state.doc.eq(pageBefore)).toBe(true);
  });
});
