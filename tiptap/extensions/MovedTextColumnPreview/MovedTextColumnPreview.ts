import { Extension } from "@tiptap/core";
import { createMovedTextColumnPreviewPlugin } from "./MovedTextColumnPreviewPlugin";

// Shows what a block resize will do to text before it's let go
export const MovedTextColumnPreview = Extension.create({
  name: "movedTextColumnPreview",

  addProseMirrorPlugins() {
    return [createMovedTextColumnPreviewPlugin()];
  },
});
