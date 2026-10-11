import { Node, mergeAttributes } from "@tiptap/core";
import { MAX_COLUMNS } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import {
  getWrappedBlockAttributes,
  toHTMLAttributes,
} from "./wrappedAttributes";
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

  // Drawn from the same attributes as the notebook view, so both match
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        HTMLAttributes,
        toHTMLAttributes(getWrappedBlockAttributes()),
      ),
      0,
    ];
  },
});
