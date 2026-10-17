import { Node, mergeAttributes } from "@tiptap/core";
import {
  getWrappedColumnAttributes,
  toHTMLAttributes,
} from "./wrappedAttributes";

// One column of a WrappedBlock wrapped block: either a single custom block,
// or text that fills the space the blocks leave
export const WrappedColumn = Node.create({
  name: "WrappedColumn",
  content: "block+",
  // keeps backspace and delete from reaching into the next column
  isolating: true,

  addAttributes() {
    return {
      // "block" or "text", kept up to date by the WrappedBlock plugin
      columnType: {
        default: "text",
        parseHTML: (element) => element.getAttribute("data-column-type"),
        rendered: false,
      },

      // A text column's width in px. Text widths and block widths together
      // fill the page, with the last text column stretching to fill the rest
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
