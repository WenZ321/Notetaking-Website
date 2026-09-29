import type { CSSProperties } from "react";

// Size of one notebook page in pixels, US Letter at 96 dpi
export const NOTEBOOK_PAGE_WIDTH = 816;
export const NOTEBOOK_PAGE_HEIGHT = 1056;

// The page size as CSS variables, set on each element that renders notebook pages
// so a notebook can have its own size later
export const NOTEBOOK_PAGE_SIZE_VARIABLES = {
  "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
  "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
} as CSSProperties;
