import { Extension } from "@tiptap/core";
import { createClickBesideRowPlugin } from "./ClickBesideRowPlugin";

// Clicking in the space beside a floated row puts the cursor in that row's
// text, even below its last line
export const ClickBesideRow = Extension.create({
  name: "clickBesideRow",

  addProseMirrorPlugins() {
    return [createClickBesideRowPlugin()];
  },
});
