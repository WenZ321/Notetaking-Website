import { Node, mergeAttributes } from "@tiptap/core";
import { MAX_COLUMNS } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
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
});
