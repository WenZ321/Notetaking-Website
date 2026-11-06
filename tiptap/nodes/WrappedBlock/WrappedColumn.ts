import { Node, mergeAttributes } from "@tiptap/core";
import {
  getWrappedColumnAttributes,
  toHTMLAttributes,
} from "./WrappedAttributes";

// One column of a WrappedBlock wrapped block: either a single custom block,
// or, in a newspaper, the text on one side of the blocks
export const WrappedColumn = Node.create({
  name: "WrappedColumn",
  content: "block+",
  // keeps backspace and delete from reaching into the next column
  isolating: true,
  // a block's column can't hold a line, so the horizontal cursor can't go in it
  allowGapCursor: false,

  addAttributes() {
    return {
      // "block" or "text", kept up to date by the WrappedBlock plugin
      columnType: {
        default: "text",
        parseHTML: (element) => element.getAttribute("data-column-type"),
        rendered: false,
      },

      // A newspaper text column's width in px. Its two text widths and the block widths together fill the page
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-width");
          return width === null ? null : Number(width);
        },
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="wrapped-column"]' }];
  },

  // Drawn from the same attributes as the notebook view, so both match
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        HTMLAttributes,
        toHTMLAttributes(getWrappedColumnAttributes(node.attrs)),
      ),
      0,
    ];
  },
});
