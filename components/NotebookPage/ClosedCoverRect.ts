import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
  NOTEBOOK_VIEW_SCALE,
} from "@/constants/NotebookPageConstants";

/**
 * Where the notebook view draws a notebook's closed cover on screen, so
 * something on another page can line up with it before going there. The
 * cover is centered across the window, under the header bar and the view's
 * top margin, matching Notebook.css and NotebookHeaderBar.css
 * @returns The cover's box on screen
 */
export function getClosedCoverRect(): DOMRect {
  const styles = getComputedStyle(document.documentElement);
  const headerHeight = parseFloat(styles.getPropertyValue("--header-height"));
  const viewTopMargin = parseFloat(
    styles.getPropertyValue("--notebook-view-top-margin"),
  );
  const rimThickness = parseFloat(
    styles.getPropertyValue("--notebook-rim-thickness"),
  );
  const spineGap = parseFloat(styles.getPropertyValue("--notebook-spine-gap"));

  // the cover is one half of the open notebook: a page, the rim around it,
  // and half the gap at the spine
  const width =
    NOTEBOOK_PAGE_WIDTH * NOTEBOOK_VIEW_SCALE + rimThickness + spineGap / 2;
  const height = NOTEBOOK_PAGE_HEIGHT * NOTEBOOK_VIEW_SCALE + 2 * rimThickness;
  return new DOMRect(
    (window.innerWidth - width) / 2,
    headerHeight + viewTopMargin,
    width,
    height,
  );
}
