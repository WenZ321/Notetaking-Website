import { Extension } from "@tiptap/core";
import { createWrappedBlockTextFlowPlugin } from "./WrappedBlockTextFlowPlugin";

// Keeps a newspaper's text beside its blocks while typing. Lines that don't
// fit are pushed down, from the left column to the right one, then under
// the blocks. Text never flows back up
export const WrappedBlockTextFlow = Extension.create({
  name: "wrappedBlockTextFlow",

  addProseMirrorPlugins() {
    return [createWrappedBlockTextFlowPlugin()];
  },
});
