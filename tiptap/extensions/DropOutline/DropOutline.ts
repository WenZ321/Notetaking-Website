import { Extension } from "@tiptap/core";
import { createDropOutlinePlugin } from "./dropOutlinePlugin";

// Shows a dashed outline of a dragged block where it will land
export const DropOutline = Extension.create({
  name: "dropOutline",

  addProseMirrorPlugins() {
    return [createDropOutlinePlugin()];
  },
});
