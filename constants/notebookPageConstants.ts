import type { CSSProperties } from "react";

// Size of one notebook page in pixels, US Letter at 96 dpi
export const NOTEBOOK_PAGE_WIDTH = 816;
export const NOTEBOOK_PAGE_HEIGHT = 1056;

// One graph paper square in pixels, a quarter inch
export const GRAPH_PAPER_SQUARE_SIZE = 24;

// The page size and grid square as CSS variables, set on each element that
// renders notebook pages so a notebook can have its own size later
export const NOTEBOOK_PAGE_VARIABLES = {
  "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
  "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
  "--graph-paper-square-size": `${GRAPH_PAPER_SQUARE_SIZE}px`,
} as CSSProperties;
