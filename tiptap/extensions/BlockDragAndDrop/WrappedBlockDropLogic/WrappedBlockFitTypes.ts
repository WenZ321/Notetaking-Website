import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";

// The block widths a drop hands out
export type WrappedBlockWidths = {
  existingBlockWidths: number[]; // one per existing block, left to right
  draggedBlockWidth: number;
};

// What the fitting works from. The smallest widths are already rounded up
// to the paper
export type WrappedBlockFitSizes = {
  existingBlockCurrentWidths: number[]; // one per existing block, left to right
  existingBlockMinWidths: number[]; // one per existing block, left to right
  draggedBlockCurrentWidth: number;
  draggedBlockMinWidth: number;
  snapBlockSide: SnapBlockSide;
};
