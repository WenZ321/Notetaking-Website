import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";

// The widths a fitting rule hands out. No text width means the text leaves
// the wrapped block
export type WrappedBlockWidths = {
  existingBlockWidth: number;
  draggedBlockWidth: number;
  textWidth: number | null;
};

// What every fitting rule works from. The smallest widths are already
// rounded up to the paper
export type WrappedBlockFitSizes = {
  existingBlockCurrentWidth: number;
  existingBlockMinWidth: number;
  draggedBlockCurrentWidth: number;
  draggedBlockMinWidth: number;
  snapBlockSide: SnapBlockSide;
};
