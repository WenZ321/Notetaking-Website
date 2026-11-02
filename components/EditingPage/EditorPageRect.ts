import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";

/**
 * Where the editor draws a page's paper on screen, inside its border, so
 * the notebook view can zoom onto it before going there. It matches
 * EditingPageClient.css: under the header and toolbar, the page sits
 * between its two arrows, centered in the column the sidebar leaves
 * @returns The page's paper box on screen
 */
export function getEditorPageRect(): DOMRect {
  const styles = getComputedStyle(document.documentElement);
  const readPixels = (name: string) =>
    parseFloat(styles.getPropertyValue(name));

  const headerHeight = readPixels("--header-height");
  const toolbarHeight = readPixels("--toolbar-height");
  const toolbarGap = readPixels("--space-2");
  const workspacePaddingTop = readPixels("--space-4");
  const workspacePaddingSide = readPixels("--space-5");
  const columnGap = readPixels("--space-4");
  const arrowSize = readPixels("--page-flip-button-size");
  const arrowGap = readPixels("--space-4");
  const sidebarMinWidth = readPixels("--editor-sidebar-min-width");
  const sidebarMaxWidth = readPixels("--editor-sidebar-max-width");
  const pageBorder = readPixels("--editor-page-border");

  // the page column fits the page and its two arrows at least. The sidebar
  // takes what's left, between its smallest and largest width, and the
  // page column gets the rest
  const pageWidth = NOTEBOOK_PAGE_WIDTH + 2 * pageBorder;
  const pageWithArrows = pageWidth + 2 * arrowSize + 2 * arrowGap;
  const roomForColumns =
    document.documentElement.clientWidth - 2 * workspacePaddingSide - columnGap;
  const sidebarWidth = Math.min(
    sidebarMaxWidth,
    Math.max(sidebarMinWidth, roomForColumns - pageWithArrows),
  );
  const pageColumnWidth = Math.max(
    pageWithArrows,
    roomForColumns - sidebarWidth,
  );

  const pageLeft =
    workspacePaddingSide +
    (pageColumnWidth - pageWithArrows) / 2 +
    arrowSize +
    arrowGap;
  const pageTop =
    headerHeight + toolbarHeight + toolbarGap + workspacePaddingTop;
  return new DOMRect(
    pageLeft + pageBorder,
    pageTop + pageBorder,
    NOTEBOOK_PAGE_WIDTH,
    NOTEBOOK_PAGE_HEIGHT,
  );
}
