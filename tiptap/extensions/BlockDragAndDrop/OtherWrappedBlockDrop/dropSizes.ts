import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { CustomBlockNode } from "@/tiptap/nodes/wrappedNodeTypes";
import type { MinBlockSize } from "../readContentMinSize";
import type { WrappedBlockFitSizes } from "./wrappedBlockFitTypes";
import {
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookTemplates/PaperLogic/snapBlockSizeToPaper";

type DropSizesInfo = {
  existingBlocks: CustomBlockNode[]; // left to right
  existingBlockMinSizes: MinBlockSize[]; // one per existing block, left to right
  draggedBlock: CustomBlockNode;
  draggedBlockMinSize: MinBlockSize;
  snapBlockSide: SnapBlockSide;
};

/**
 * Each block's current width and smallest width, which every fitting rule
 * works from. Existing blocks keep their width if they can and shrink down to
 * what their content needs, rounded up to the paper
 * @returns The sizes for the fitting rules
 */
export function buildFitSizes({
  existingBlocks,
  existingBlockMinSizes,
  draggedBlock,
  draggedBlockMinSize,
  snapBlockSide,
}: DropSizesInfo): WrappedBlockFitSizes {
  // a smallest width uses itself as the min, so the paper can only round it
  // up, never below what the content needs
  const snapMinWidth = (contentMinWidth: number) => {
    const minWidth = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    return snapBlockSide(minWidth, { min: minWidth, max: Infinity });
  };

  const existingBlockCurrentWidths = existingBlocks.map(
    (block) => block.attrs.width as number,
  );
  // a block already narrower than its smallest width, like one made before
  // graph paper, isn't made to grow
  const existingBlockMinWidths = existingBlockMinSizes.map((minSize, index) =>
    Math.min(existingBlockCurrentWidths[index], snapMinWidth(minSize.width)),
  );

  // the dropped block can grow to reach its smallest width
  return {
    existingBlockCurrentWidths,
    existingBlockMinWidths,
    draggedBlockCurrentWidth: draggedBlock.attrs.width as number,
    draggedBlockMinWidth: snapMinWidth(draggedBlockMinSize.width),
    snapBlockSide,
  };
}

/**
 * The height every block in the new wrapped block shares: the tallest
 * existing block, or taller if the dropped block's content needs more,
 * rounded up to the paper
 * @returns The shared height
 */
export function getSharedHeight({
  existingBlocks,
  draggedBlockMinSize,
  snapBlockSide,
}: Pick<
  DropSizesInfo,
  "existingBlocks" | "draggedBlockMinSize" | "snapBlockSide"
>): number {
  const tallestExistingBlock = Math.max(
    ...existingBlocks.map((block) => block.attrs.height as number),
  );
  const draggedMinHeight = Math.max(
    MIN_BLOCK_HEIGHT,
    draggedBlockMinSize.height,
  );
  const draggedSnappedMinHeight = snapBlockSide(draggedMinHeight, {
    min: draggedMinHeight,
    max: Infinity,
  });

  return Math.max(tallestExistingBlock, draggedSnappedMinHeight);
}
