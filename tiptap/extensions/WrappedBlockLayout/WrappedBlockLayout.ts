import { Extension } from "@tiptap/core";
import { NORMALIZE_META, createWrappedBlockPlugin } from "./wrappedBlockPlugin";

// Keeps every custom block inside a WrappedBlock row, and keeps each row
// following the column rules
export const WrappedBlockLayout = Extension.create({
  name: "wrappedBlockLayout",

  // Applies the row rules once when the page opens, e.g. to blocks saved
  // before rows existed
  onCreate() {
    const { state, view } = this.editor;
    view.dispatch(
      state.tr.setMeta(NORMALIZE_META, true).setMeta("addToHistory", false),
    );
  },

  addProseMirrorPlugins() {
    return [createWrappedBlockPlugin()];
  },
});
