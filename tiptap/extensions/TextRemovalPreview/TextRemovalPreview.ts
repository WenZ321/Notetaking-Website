import { Extension } from "@tiptap/core";
import { createTextRemovalPreviewPlugin } from "./TextRemovalPreviewPlugin";

// Shows what a block resize will do to text before it's let go
export const TextRemovalPreview = Extension.create({
  name: "textRemovalPreview",

  addProseMirrorPlugins() {
    return [createTextRemovalPreviewPlugin()];
  },
});
