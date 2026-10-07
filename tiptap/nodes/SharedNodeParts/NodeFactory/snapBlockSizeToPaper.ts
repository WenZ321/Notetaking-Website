import type { NotebookTemplate } from "@/types/notebook";
import { getPaperSnapLength } from "@/components/NotebookTemplates/notebookTemplates";

// Fits a new block's size to the page's paper, like whole squares on graph
// paper. Nodes without a size, like inline math, are left as is
export function snapBlockSizeToPaper<TAttrs extends Record<string, unknown>>(
  attrs: TAttrs,
  template?: NotebookTemplate,
): TAttrs {
  if (typeof attrs.width !== "number" || typeof attrs.height !== "number") {
    return attrs;
  }

  const snapLength = getPaperSnapLength(template);

  return {
    ...attrs,
    width: snapLength(attrs.width),
    height: snapLength(attrs.height),
  };
}
