import { Extension } from "@tiptap/core";
import { createCopyPastePlugin } from "./CopyPastePlugin";

// Our own rules for what happens when content is copied or pasted
export const CopyPaste = Extension.create({
  name: "copyPaste",

  addProseMirrorPlugins() {
    return [createCopyPastePlugin()];
  },
});
