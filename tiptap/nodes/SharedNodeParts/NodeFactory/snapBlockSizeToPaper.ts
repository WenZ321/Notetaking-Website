import type { NotebookTemplate } from "@/types/notebook";
import { GRAPH_PAPER_SQUARE_SIZE } from "@/constants/notebookPageConstants";

// Rounds to the closest whole number of squares, never less than one
function snapToSquares(value: number): number {
  const squares = Math.max(1, Math.round(value / GRAPH_PAPER_SQUARE_SIZE));
  return squares * GRAPH_PAPER_SQUARE_SIZE;
}

// On graph paper a new block's size is rounded to whole squares so it
// lines up with the grid. Other papers, and nodes without a size like
// inline math, are left as is
export function snapBlockSizeToPaper<TAttrs extends Record<string, unknown>>(
  attrs: TAttrs,
  template?: NotebookTemplate,
): TAttrs {
  if (template !== "graph") return attrs;
  if (typeof attrs.width !== "number" || typeof attrs.height !== "number") {
    return attrs;
  }

  return {
    ...attrs,
    width: snapToSquares(attrs.width),
    height: snapToSquares(attrs.height),
  };
}
