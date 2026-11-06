import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { readRowTopGaps } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import { ROW_TOP_GAP_VARIABLE } from "@/tiptap/nodes/WrappedBlock/WrappedAttributes";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// The plugin's memory: the gap above each row, top of the page first
const rowTopGapPluginKey = new PluginKey<number[]>("rowTopGap");

// Where each row starts and ends in the page, top of the page first
function getRowSpans(doc: PageNode) {
  const spans: { from: number; to: number }[] = [];
  doc.forEach((node, pos) => {
    if (node.type.name === "WrappedBlock") {
      spans.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  return spans;
}

// Measures the rows and draws new gaps if they moved off the paper's lines
function alignRows(view: EditorView, topStep: number) {
  if (view.isDestroyed) return;

  const { state } = view;
  const rows = getRowSpans(state.doc).map(({ from }) => view.nodeDOM(from));

  // a row can be on the page before it's drawn, the next frame measures it
  if (!rows.every((row) => row instanceof HTMLElement)) return;

  const gaps = readRowTopGaps(rows, topStep);
  if (gaps.join() === rowTopGapPluginKey.getState(state)?.join()) return;

  dispatchChange(view, state.tr.setMeta(rowTopGapPluginKey, gaps), "skipUndo");
}

// Moves each row down to the paper's next line, since the text above it can
// end anywhere. The gaps aren't saved, they're measured from what's drawn
export function createRowTopGapPlugin(topStep: number): Plugin {
  return new Plugin<number[]>({
    key: rowTopGapPluginKey,

    state: {
      init: () => [],
      apply: (tr, gaps) =>
        (tr.getMeta(rowTopGapPluginKey) as number[] | undefined) ?? gaps,
    },

    props: {
      decorations: (state) => {
        const gaps = rowTopGapPluginKey.getState(state) ?? [];
        const rows = getRowSpans(state.doc).map(({ from, to }, index) =>
          Decoration.node(from, to, {
            style: `${ROW_TOP_GAP_VARIABLE}: ${gaps[index] ?? 0}px`,
          }),
        );
        return DecorationSet.create(state.doc, rows);
      },
    },

    // Measured right away so the page full check sees the gaps, and again on
    // the next frame, since new blocks are drawn a moment after the change.
    // An update with no change comes from React drawing, which can't take a
    // change of ours yet, so that one only measures on the next frame
    view: () => ({
      update: (view, prevState) => {
        if (view.state !== prevState) alignRows(view, topStep);
        requestAnimationFrame(() => alignRows(view, topStep));
      },
    }),
  });
}
