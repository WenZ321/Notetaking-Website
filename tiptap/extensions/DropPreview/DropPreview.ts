import { Extension } from "@tiptap/core";
import { createDropPreviewPlugin } from "./dropPreviewPlugin";

// Shows a dashed outline of a dragged block where it will land
export const DropPreview = Extension.create({
  name: "dropPreview",

  addProseMirrorPlugins() {
    return [createDropPreviewPlugin()];
  },
});
