import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";
import { readInsertPanelHidden } from "./InsertPanelHidden";

/**
 * Where the editor draws a page's paper on screen, inside its border, so
 * the notebook view can zoom onto it before going there. It matches
 * EditingPageClient.css: under the header and toolbar, the page sits
 * between its two arrows, centered in the space left of the sidebar, or in
 * the whole window while the sidebar is hidden
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
  // the notebook and the room around it grow with the screen like the
  // interface does
  const pageScale = uiScale;
  const workspacePaddingTop =
    (readPixels("--notebook-rim-thickness") + readPixels("--space-4")) *
    pageScale;
  const columnGap = readPixels("--space-4") * pageScale;
  const arrowSize = readPixels("--page-flip-button-size") * uiScale;
  const arrowGap = readPixels("--space-4") * pageScale;
  const sidebarMinWidth = readPixels("--editor-sidebar-min-width") * uiScale;
  const sidebarMaxWidth = readPixels("--editor-sidebar-max-width") * uiScale;
  const pageBorder = readPixels("--editor-page-border");

  // the page column fits the page and its two arrows at least. The sidebar
  // takes what's left, between its smallest and largest width, and the
  // page column gets the rest, with the page centered in it
  const pageWidth = NOTEBOOK_PAGE_WIDTH * pageScale + 2 * pageBorder;
  const pageWithArrows = pageWidth + 2 * arrowSize + 2 * arrowGap;
  const roomForColumns = document.documentElement.clientWidth - columnGap;
  const sidebarWidth = Math.min(
    sidebarMaxWidth,
    Math.max(sidebarMinWidth, roomForColumns - pageWithArrows),
  );
  const pageColumnWidth = Math.max(
    pageWithArrows,
    readInsertPanelHidden()
      ? document.documentElement.clientWidth
      : roomForColumns - sidebarWidth,
  );

  const pageLeft =
    (pageColumnWidth - pageWithArrows) / 2 + arrowSize + arrowGap;
  const pageTop =
    headerHeight + toolbarHeight + toolbarGap + workspacePaddingTop;
  return new DOMRect(
    pageLeft + pageBorder,
    pageTop + pageBorder,
    NOTEBOOK_PAGE_WIDTH * pageScale,
    NOTEBOOK_PAGE_HEIGHT * pageScale,
  );
}
