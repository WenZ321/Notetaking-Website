import { Extension } from "@tiptap/core";
import { createResizePreviewPlugin } from "./resizePreviewPlugin";

// Shows what a block resize will do to text before it's let go
export const ResizePreview = Extension.create({
  name: "resizePreview",

  addProseMirrorPlugins() {
    return [createResizePreviewPlugin()];
  },
});
