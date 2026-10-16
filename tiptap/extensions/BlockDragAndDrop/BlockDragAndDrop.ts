import type { NotebookTemplate } from "@/types/notebook";
import { Extension } from "@tiptap/core";
import { getPaperSnapBlockSide } from "@/components/NotebookTemplates/notebookTemplates";
import { createBlockDragAndDropPlugin } from "./blockDragAndDropPlugin";

type BlockDragAndDropOptions = {
  template: NotebookTemplate | undefined; // the page's paper, which dropped blocks fit their size to
};

// Lets custom blocks be moved by dragging, landing where the drop rule says
export const BlockDragAndDrop = Extension.create<BlockDragAndDropOptions>({
  name: "blockDragAndDrop",

  addOptions() {
    return { template: undefined };
  },

  addProseMirrorPlugins() {
    return [
      createBlockDragAndDropPlugin(
        getPaperSnapBlockSide(this.options.template),
      ),
    ];
  },
});
