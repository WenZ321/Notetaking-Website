import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";

// The notebook view keeps its open pages in the URL as a page number like ?page=5,
// which is also that page's index since the cover sits at index 0.
// A missing page param means the cover is shown
export const PAGE_PARAM = "page";

// Right page of the open pair containing a page. Like a printed book, odd
// pages sit on the right, so page 1 sits alone across from the inside of the
// cover. Closed, the cover lies on the right half, so it's its own pair.
// For example 1 → 1, 2 → 3, 3 → 3, and 0 or below → the cover
export function getRightPageIndex(pageIndex: number): number {
  if (pageIndex <= COVER_PAGE_INDEX) return COVER_PAGE_INDEX;

  return pageIndex % 2 === 0 ? pageIndex + 1 : pageIndex;
}

export function getNotebookPageHref(
  notebookId: string,
  rightPageIndex: number,
): string {
  const notebookHref = `/userNotebooks/${notebookId}`;
  if (rightPageIndex === COVER_PAGE_INDEX) return notebookHref;

  return `${notebookHref}?${PAGE_PARAM}=${rightPageIndex}`;
}

// Reads the page param back into the right page index to show, a missing or invalid one is the cover.
// Page numbers past the end of the notebook show its last pair instead
export function parseRightPageIndex(
  pageParam: string | null,
  pageCount: number,
): number {
  const pageIndex = Number.parseInt(pageParam ?? "", 10);
  if (Number.isNaN(pageIndex)) return COVER_PAGE_INDEX;

  return Math.min(
    getRightPageIndex(pageIndex),
    getRightPageIndex(pageCount - 1),
  );
}
