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

      // The left text's width in px, saved only in rows with text on both
      // sides of a block, so the split stays where the user put it
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
