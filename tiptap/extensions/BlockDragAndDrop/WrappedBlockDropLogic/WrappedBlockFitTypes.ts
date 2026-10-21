import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";

// The widths a fitting rule hands out. No text width means the text leaves
// the wrapped block
export type WrappedBlockWidths = {
  existingBlockWidths: number[]; // one per existing block, left to right
  draggedBlockWidth: number;
  textWidth: number | null;
};

// What every fitting rule works from. The smallest widths are already
// rounded up to the paper
export type WrappedBlockFitSizes = {
  existingBlockCurrentWidths: number[]; // one per existing block, left to right
  existingBlockMinWidths: number[]; // one per existing block, left to right
  draggedBlockCurrentWidth: number;
  draggedBlockMinWidth: number;
  snapBlockSide: SnapBlockSide;
};
