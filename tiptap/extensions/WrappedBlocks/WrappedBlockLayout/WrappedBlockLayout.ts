import { Extension } from "@tiptap/core";
import {
  NORMALIZE_META,
  createWrappedBlockLayoutPlugin,
} from "./WrappedBlockLayoutPlugin";
import { createSnapPreviewPlugin } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/SnapPreviewPlugin";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// Keeps every custom block in a row, and every row following the row rules.
// Also draws the snap preview while a block is resized
export const WrappedBlockLayout = Extension.create({
  name: "wrappedBlockLayout",

  // Checks the whole page once when it opens, like a page saved before a rule changed
  onCreate() {
    const { state, view } = this.editor;
    dispatchChange(view, state.tr.setMeta(NORMALIZE_META, true), "skipUndo");
  },

  addProseMirrorPlugins() {
    return [createWrappedBlockLayoutPlugin(), createSnapPreviewPlugin()];
  },
});
