import { Extension } from "@tiptap/core";
import { createClickBesideRowPlugin } from "./ClickBesideRowPlugin";

// Clicking in the space beside a floated row puts the cursor in that row's
// text, even below its last line. Clicking the gap above a row puts it on the
// line above that gap
export const ClickBesideRow = Extension.create({
  name: "clickBesideRow",

  addProseMirrorPlugins() {
    return [createClickBesideRowPlugin()];
  },
});
