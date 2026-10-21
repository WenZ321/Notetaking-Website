import { Extension } from "@tiptap/core";
import { createWrappedBlockTextFlowPlugin } from "./WrappedBlockTextFlowPlugin";

// Keeps text beside blocks inside its wrapped block while typing. Lines that
// don't fit are pushed down, and the text after a column flows back up when
// there's room again
export const WrappedBlockTextFlow = Extension.create({
  name: "wrappedBlockTextFlow",

  addProseMirrorPlugins() {
    return [createWrappedBlockTextFlowPlugin()];
  },
});
