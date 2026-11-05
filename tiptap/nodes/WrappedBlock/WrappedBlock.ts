import { Node, mergeAttributes } from "@tiptap/core";
import { MAX_COLUMNS } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { DEFAULT_WRAP } from "./WrappedBlockType";
import {
  ROW_BOX_CLASS,
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
  // keeps backspace and delete from joining two rows through the line between
  isolating: true,
  // only a row's blocks can be selected. A selected row shows no outline, so
  // backspace would select it unseen and the next press would delete it
  selectable: false,

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
      { class: ROW_BOX_CLASS },
      [
        "div",
        mergeAttributes(
          HTMLAttributes,
          toHTMLAttributes(getWrappedBlockAttributes(node.attrs)),
        ),
        0,
      ],
    ];
  },
});
