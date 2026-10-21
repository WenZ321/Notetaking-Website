import type { NotebookTemplate } from "@/types/Notebook";
import { Extension } from "@tiptap/core";
import { getPaperSnapBlockSide } from "@/components/NotebookTemplates/NotebookTemplates";
import { createBlockDragAndDropPlugin } from "./BlockDragAndDropPlugin";

type BlockDragAndDropOptions = {
  template: NotebookTemplate; // the page's paper, which dropped blocks fit their size to
};

// Lets custom blocks be moved by dragging, landing where the drop rule says
export const BlockDragAndDrop = Extension.create<BlockDragAndDropOptions>({
  name: "blockDragAndDrop",

  // the editor always sets the template, blank is only the required default
  addOptions() {
    return { template: "blank" };
  },

  addProseMirrorPlugins() {
    return [
      createBlockDragAndDropPlugin(
        getPaperSnapBlockSide(this.options.template),
      ),
    ];
  },
});
