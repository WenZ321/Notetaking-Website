import { Paragraph as BaseParagraph } from "@tiptap/extension-paragraph";

// Tiptap's paragraph, plus isNewLine. It's false only on the cut-off end of
// a line pushed out of a wrapped block, so it rejoins that line when it flows
// back. Pressing Enter in it makes the new half a new line
export const Paragraph = BaseParagraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      isNewLine: {
        default: true,
        keepOnSplit: false,
        parseHTML: (element) =>
          element.getAttribute("data-is-new-line") !== "false",
        renderHTML: (attributes) =>
          attributes.isNewLine ? {} : { "data-is-new-line": "false" },
      },
    };
  },
});
