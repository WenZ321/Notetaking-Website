import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";
import { readInsertPanelHidden } from "./InsertPanelHidden";

/**
 * Where the editor draws a page's paper on screen, inside its border, so
 * the notebook view can zoom onto it before going there. It matches
 * EditingPageClient.css: under the header and toolbar, the page sits
 * between its two arrows, centered in the window between an empty column
 * and the sidebar, or in the whole window while the sidebar is hidden
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
  // interface does, and shrink so the page fits a short window
  const pageScale = readPixels("--editor-notebook-scale") || uiScale;
  const workspacePaddingTop =
    (readPixels("--notebook-rim-thickness") + readPixels("--space-4")) *
    pageScale;
  const columnGap = readPixels("--space-4") * pageScale;
  const arrowSize = readPixels("--page-flip-button-size") * uiScale;
  // 4px further out than the other gaps
  const arrowGap = readPixels("--space-4") * pageScale + 4;
  const sidebarMinWidth = readPixels("--editor-sidebar-min-width") * uiScale;
  const sidebarMaxWidth = readPixels("--editor-sidebar-max-width") * uiScale;
  const pageBorder = readPixels("--editor-page-border");

  // the page column fits the page and its two arrows at least. The room
  // left is shared by the empty column on the left, from nothing, and the
  // sidebar, from its smallest width, until each reaches the sidebar's
  // largest width. The page column gets the rest, with the page centered
  const windowWidth = document.documentElement.clientWidth;
  const pageWidth = NOTEBOOK_PAGE_WIDTH * pageScale + 2 * pageBorder;
  const pageWithArrows = pageWidth + 2 * arrowSize + 2 * arrowGap;
  const roomLeft = windowWidth - 2 * columnGap - pageWithArrows;
  const sidebarWidth = Math.min(
    sidebarMaxWidth,
    Math.max(sidebarMinWidth, (roomLeft + sidebarMinWidth) / 2),
  );
  const emptyColumnWidth = Math.min(
    sidebarMaxWidth,
    Math.max(0, roomLeft - sidebarWidth),
  );
  const isPanelHidden = readInsertPanelHidden();
  const pageColumnLeft = isPanelHidden ? 0 : emptyColumnWidth + columnGap;
  const pageColumnWidth = Math.max(
    pageWithArrows,
    isPanelHidden
      ? windowWidth
      : roomLeft + pageWithArrows - emptyColumnWidth - sidebarWidth,
  );

  const pageLeft =
    pageColumnLeft +
    (pageColumnWidth - pageWithArrows) / 2 +
    arrowSize +
    arrowGap;
  const pageTop =
    headerHeight + toolbarHeight + toolbarGap + workspacePaddingTop;
  return new DOMRect(
    pageLeft + pageBorder,
    pageTop + pageBorder,
    NOTEBOOK_PAGE_WIDTH * pageScale,
    NOTEBOOK_PAGE_HEIGHT * pageScale,
  );
}
