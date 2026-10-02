import { Node, mergeAttributes } from "@tiptap/core";
import { NORMALIZE_META, createWrappedBlockPlugin } from "./wrappedBlockPlugin";
import { MAX_COLUMNS } from "./arrangeWrappedBlocks";
import "./WrappedBlock.css";

// A full-width row of 1 to 3 columns. Every custom block lives in one,
// and the space the blocks leave is filled with text
export const WrappedBlock = Node.create({
  name: "WrappedBlock",
  group: "block",
  content: `WrappedColumn{1,${MAX_COLUMNS}}`,

  parseHTML() {
    return [{ tag: 'div[data-type="wrapped-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "wrapped-block",
        class: "wrapped-block",
      }),
      0,
    ];
  },

  // Applies the row rules once when the page opens, e.g. to blocks saved
  // before rows existed
  onCreate() {
    const { state, view } = this.editor;
    view.dispatch(
      state.tr.setMeta(NORMALIZE_META, true).setMeta("addToHistory", false),
    );
  },

  addProseMirrorPlugins() {
    return [createWrappedBlockPlugin(this.type)];
  },
});
