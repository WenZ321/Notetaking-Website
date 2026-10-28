import type { NotebookPaperType } from "@/types/Notebook";
import { Extension } from "@tiptap/core";
import { getPaperSnapBlockSide } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import { createBlockDragAndDropPlugin } from "./BlockDragAndDropPlugin";

type BlockDragAndDropOptions = {
  paperType: NotebookPaperType; // the page's paper, which dropped blocks fit their size to
};

// Lets custom blocks be moved by dragging, landing where the drop rule says
export const BlockDragAndDrop = Extension.create<BlockDragAndDropOptions>({
  name: "blockDragAndDrop",

  // the editor always sets the paper type, blank is only the required default
  addOptions() {
    return { paperType: "blank" };
  },

  addProseMirrorPlugins() {
    return [
      createBlockDragAndDropPlugin(
        getPaperSnapBlockSide(this.options.paperType),
      ),
    ];
  },
});
