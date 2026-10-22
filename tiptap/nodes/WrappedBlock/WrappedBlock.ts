import { Node, mergeAttributes } from "@tiptap/core";
import { MAX_COLUMNS } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { DEFAULT_WRAP } from "./WrappedBlockType";
import {
  getWrappedBlockAttributes,
  toHTMLAttributes,
} from "./WrappedAttributes";
import "./WrappedBlock.css";

// Holds one or more custom blocks side by side. Every custom block lives in
// one. Its wrap says how the text sits around the blocks
export const WrappedBlock = Node.create({
  name: "WrappedBlock",
  group: "block",
  content: `WrappedColumn{1,${MAX_COLUMNS}}`,

  addAttributes() {
    return {
      // "left", "right" or "newspaper",
      wrap: {
        default: DEFAULT_WRAP,
        parseHTML: (element) => element.getAttribute("data-wrap"),
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="wrapped-block"]' }];
  },

  // Drawn from the same attributes as the notebook view, so both match
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        HTMLAttributes,
        toHTMLAttributes(getWrappedBlockAttributes(node.attrs)),
      ),
      0,
    ];
  },
});
