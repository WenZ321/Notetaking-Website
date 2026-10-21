import { Extension } from "@tiptap/core";
import {
  NORMALIZE_META,
  createWrappedBlockLayoutPlugin,
} from "./WrappedBlockLayoutPlugin";

// Keeps every custom block inside a WrappedBlock wrapped block, and keeps each wrapped block
// following the column rules
export const WrappedBlockLayout = Extension.create({
  name: "wrappedBlockLayout",

  // Applies the wrapped block rules once when the page opens, e.g. to blocks saved
  // before wrapped blocks existed
  onCreate() {
    const { state, view } = this.editor;
    view.dispatch(
      state.tr.setMeta(NORMALIZE_META, true).setMeta("addToHistory", false),
    );
  },

  addProseMirrorPlugins() {
    return [createWrappedBlockLayoutPlugin()];
  },
});
