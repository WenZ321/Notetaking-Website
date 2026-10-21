import { Extension } from "@tiptap/core";
import { createEmptyLineCaretPlugin } from "./EmptyLineCaretPlugin";

// Keeps the cursor on an empty line the same size as the text about to be typed
export const EmptyLineCaret = Extension.create({
  name: "emptyLineCaret",

  addProseMirrorPlugins() {
    return [createEmptyLineCaretPlugin()];
  },
});
