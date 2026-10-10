import type { NotebookTemplate } from "@/types/notebook";
import type { MaxBlockSize } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/ReactNodeFactory";
import { getPaperSnapLength } from "@/components/NotebookTemplates/notebookTemplates";

export const MIN_BLOCK_WIDTH = 150;
export const MIN_BLOCK_HEIGHT = 24;

// Fits a new block's size to the page's paper, like whole squares on graph
// paper. Nodes without a size, like inline math, are left as is
export function snapBlockSizeToPaper<TAttrs extends Record<string, unknown>>(
  attrs: TAttrs,
  template: NotebookTemplate | undefined,
  { maxWidth, maxHeight }: MaxBlockSize,
): TAttrs {
  if (typeof attrs.width !== "number" || typeof attrs.height !== "number") {
    return attrs;
  }

  const snapLength = getPaperSnapLength(template);

  return {
    ...attrs,
    width: snapLength(attrs.width, { min: MIN_BLOCK_WIDTH, max: maxWidth }),
    // A block's own min height is only known once it's on the page, so
    // starting heights are kept well above it
    height: snapLength(attrs.height, { min: MIN_BLOCK_HEIGHT, max: maxHeight }),
  };
}
