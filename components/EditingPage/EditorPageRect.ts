import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";

/**
 * Where the editor draws a page's paper on screen, inside its border, so
 * the notebook view can zoom onto it before going there. It matches
 * EditingPageClient.css: under the header and toolbar, the page sits
 * between its two arrows, centered in the window while the sidebar fits
 * @returns The page's paper box on screen
 */
export function getEditorPageRect(): DOMRect {
  const styles = getComputedStyle(document.documentElement);
  const readPixels = (name: string) =>
    parseFloat(styles.getPropertyValue(name));

  // the header, toolbar, arrows and sidebar are drawn at the interface's
  // size, the room around the page isn't
  const uiScale = readPixels("--ui-scale");
  const headerHeight = readPixels("--header-height") * uiScale;
  const toolbarHeight = readPixels("--toolbar-height") * uiScale;
  const toolbarGap = readPixels("--space-2") * uiScale;
  const workspacePaddingTop =
    readPixels("--notebook-rim-thickness") + readPixels("--space-4");
  const columnGap = readPixels("--space-4");
  const arrowSize = readPixels("--page-flip-button-size") * uiScale;
  const arrowGap = readPixels("--space-4");
  const sidebarMinWidth = readPixels("--editor-sidebar-min-width") * uiScale;
  const pageBorder = readPixels("--editor-page-border");

  // the page and its arrows sit between two equal sides. Once the right
  // side is down to the sidebar's smallest width, the left side gets the
  // rest, down to nothing
  const pageWidth = NOTEBOOK_PAGE_WIDTH + 2 * pageBorder;
  const pageWithArrows = pageWidth + 2 * arrowSize + 2 * arrowGap;
  const roomForSides =
    document.documentElement.clientWidth - pageWithArrows - 2 * columnGap;
  const leftSideWidth = Math.max(
    0,
    Math.min(roomForSides / 2, roomForSides - sidebarMinWidth),
  );

  const pageLeft = leftSideWidth + columnGap + arrowSize + arrowGap;
  const pageTop =
    headerHeight + toolbarHeight + toolbarGap + workspacePaddingTop;
  return new DOMRect(
    pageLeft + pageBorder,
    pageTop + pageBorder,
    NOTEBOOK_PAGE_WIDTH,
    NOTEBOOK_PAGE_HEIGHT,
  );
}
