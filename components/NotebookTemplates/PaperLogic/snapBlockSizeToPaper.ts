import type { NotebookTemplate } from "@/types/notebook";
import type { MaxBlockSize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/ReactNodeFactory";
import { getPaperSnapBlockSide } from "@/components/NotebookTemplates/notebookTemplates";

export const MIN_BLOCK_WIDTH = 150;
export const MIN_BLOCK_HEIGHT = 24;

// Updates a new block's width and height, snapped to the paper type and kept within its min and max
export function snapBlockSizeToPaper<
  TAttrs extends { width: number; height: number },
>(
  attrs: TAttrs,
  template: NotebookTemplate | undefined,
  { maxWidth, maxHeight }: MaxBlockSize,
): TAttrs {
  // the paper's snapping function, which at least keeps the length within its limits
  const snapBlockSide = getPaperSnapBlockSide(template);

  return {
    ...attrs,
    width: snapBlockSide(attrs.width, { min: MIN_BLOCK_WIDTH, max: maxWidth }),
    height: snapBlockSide(attrs.height, {
      min: MIN_BLOCK_HEIGHT,
      max: maxHeight,
    }),
  };
}
