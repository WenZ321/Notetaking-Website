import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";

// The widths a fitting rule hands out. No text width means the text leaves
// the wrapped block
export type WrappedBlockWidths = {
  existingBlock: number;
  dragged: number;
  text: number | null;
};

// What every fitting rule works from. The smallest widths are already
// rounded up to the paper
export type WrappedBlockFitSizes = {
  existingBlockWidth: number;
  existingBlockMin: number;
  draggedWidth: number;
  draggedMin: number;
  snapBlockSide: SnapBlockSide;
};
