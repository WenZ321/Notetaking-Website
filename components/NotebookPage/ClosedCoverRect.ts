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
  const readPixels = (name: string) =>
    parseFloat(styles.getPropertyValue(name));

  // the header, the room above the notebook and the notebook itself grow
  // with the screen like the interface does
  const uiScale = readPixels("--ui-scale");
  const notebookScale = NOTEBOOK_VIEW_SCALE * uiScale;
  const headerHeight = readPixels("--header-height") * uiScale;
  const viewTopMargin = readPixels("--notebook-view-top-margin") * uiScale;
  // the rim and spine gap are set at full size, so they shrink with the pages
  const rimThickness = readPixels("--notebook-rim-thickness") * notebookScale;
  const spineGap = readPixels("--notebook-spine-gap") * notebookScale;

  // the cover is one half of the open notebook: a page, the rim around it,
  // and half the gap at the spine
  const width =
    NOTEBOOK_PAGE_WIDTH * notebookScale + rimThickness + spineGap / 2;
  const height = NOTEBOOK_PAGE_HEIGHT * notebookScale + 2 * rimThickness;
  return new DOMRect(
    (window.innerWidth - width) / 2,
    headerHeight + viewTopMargin,
    width,
    height,
  );
}
