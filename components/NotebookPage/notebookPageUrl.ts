import { COVER_PAGE_INDEX } from "@/data/createNotebookPages";

// The notebook view keeps its open pages in the URL as a page number like ?page=5,
// which is also that page's index since the cover sits at index 0.
// A missing page param means the cover is shown
export const PAGE_PARAM = "page";

// Left page of the open pair containing a page, pairs start on odd indexes since the cover takes index 0.
// For example 1 → 1, 2 → 1, 3 → 3, 4 → 3, and 0 or below → the cover
export function getLeftPageIndex(pageIndex: number): number {
  if (pageIndex <= COVER_PAGE_INDEX) return COVER_PAGE_INDEX;

  return pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
}

export function getNotebookPageHref(
  notebookId: string,
  leftPageIndex: number,
): string {
  const notebookHref = `/userNotebooks/${notebookId}`;
  if (leftPageIndex === COVER_PAGE_INDEX) return notebookHref;

  return `${notebookHref}?${PAGE_PARAM}=${leftPageIndex}`;
}

// Reads the page param back into the left page index to show, a missing or invalid one is the cover.
// Page numbers past the end of the notebook show its last pair instead
export function parseLeftPageIndex(
  pageParam: string | null,
  pageCount: number,
): number {
  const pageIndex = Number.parseInt(pageParam ?? "", 10);
  if (Number.isNaN(pageIndex)) return COVER_PAGE_INDEX;

  return Math.min(getLeftPageIndex(pageIndex), getLeftPageIndex(pageCount - 1));
}
