import { Node, mergeAttributes } from "@tiptap/core";

// One column of a WrappedBlock row: either a single custom block,
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
        renderHTML: (attrs) => ({ "data-column-type": attrs.columnType }),
      },

      // The column's width in px. Every column saves one and together they
      // fill the page, with the last text column stretching to fill the rest
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-width");
          return width === null ? null : Number(width);
        },
        renderHTML: (attrs) =>
          attrs.width === null
            ? {}
            : {
                "data-width": attrs.width,
                style: `--column-width: ${attrs.width}px`,
              },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="wrapped-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "wrapped-column",
        class: "wrapped-column",
      }),
      0,
    ];
  },
});
