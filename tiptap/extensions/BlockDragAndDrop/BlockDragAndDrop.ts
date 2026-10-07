import { Extension } from "@tiptap/core";
import { createBlockDragAndDropPlugin } from "./blockDragAndDropPlugin";

// Lets custom blocks be moved by dragging, landing where the drop rule says
export const BlockDragAndDrop = Extension.create({
  name: "blockDragAndDrop",

  addProseMirrorPlugins() {
    return [createBlockDragAndDropPlugin()];
  },
});
