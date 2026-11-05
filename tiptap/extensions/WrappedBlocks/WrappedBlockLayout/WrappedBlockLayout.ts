import type { NotebookPaperType } from "@/types/Notebook";
import { Extension } from "@tiptap/core";
import { getPaperBlockTopStep } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import {
  NORMALIZE_META,
  createWrappedBlockLayoutPlugin,
} from "./WrappedBlockLayoutPlugin";
import { createRowTopGapPlugin } from "./RowTopGapPlugin";
import { createSnapPreviewPlugin } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/SnapPreviewPlugin";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

type WrappedBlockLayoutOptions = {
  paperType: NotebookPaperType; // the page's paper, whose lines rows start on
};

// Keeps every custom block in a row, and every row following the row rules.
// Also draws the snap preview while a block is resized
export const WrappedBlockLayout = Extension.create<WrappedBlockLayoutOptions>({
  name: "wrappedBlockLayout",

  // the editor always sets the paper type, blank is only the required default
  addOptions() {
    return { paperType: "blank" };
  },

  // Checks the whole page once when it opens, like a page saved before a rule changed
  onCreate() {
    const { state, view } = this.editor;
    dispatchChange(view, state.tr.setMeta(NORMALIZE_META, true), "skipUndo");
  },

  addProseMirrorPlugins() {
    return [
      createWrappedBlockLayoutPlugin(),
      createSnapPreviewPlugin(),
      createRowTopGapPlugin(getPaperBlockTopStep(this.options.paperType)),
    ];
  },
});
