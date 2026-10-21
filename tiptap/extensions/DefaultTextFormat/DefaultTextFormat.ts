import { Extension } from "@tiptap/core";
import { createDefaultTextFormatPlugin } from "./DefaultTextFormatPlugin";

// Makes sure all typed or pasted text has a font, size and color
export const DefaultTextFormat = Extension.create({
  name: "defaultTextFormat",

  addProseMirrorPlugins() {
    return [createDefaultTextFormatPlugin()];
  },
});
