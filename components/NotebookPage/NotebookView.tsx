import type { NotebookPageState, NotebookState } from "@/types/Notebook";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageFlipButton } from "../PageFlipButton";
import { Notebook } from "./Notebook";
import { NotebookSheet } from "./NotebookSheet";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import { NOTEBOOK_PAGE_VARIABLES } from "@/constants/NotebookPageConstants";
import { DEFAULT_TEXT_FORMAT_VARIABLES } from "@/constants/TextFormattingConstants";
import { getEditorPageRect } from "../EditingPage/EditorPageRect";
import { markArrivingFromNotebookView } from "../EditingPage/ArrivingFromNotebookView";
import "./NotebookView.css";

type NotebookViewProps = {
  currentNotebookState: NotebookState;
  leftPageIndex: number;
  scale: number;
  onPreviousPages: () => void;
  onNextPages: () => void;
};

// How the view moves to zoom onto a page: the point it grows from, in the
// view's own pixels, how far it slides, and how much it grows
type PageZoom = {
  originX: number;
  originY: number;
  moveX: number;
  moveY: number;
  scale: number;
  pageId: string;
};

/**
 * The notebook view, showing the closed cover or two pages at a time with arrows to flip between them.
 * The cover and the pages turn over on the spine, and the arrows wait while they turn
 */
export function NotebookView({
  currentNotebookState,
  leftPageIndex,
  scale,
  onPreviousPages,
  onNextPages,
}: NotebookViewProps) {
  const { id: notebookId, paperType } = currentNotebookState;
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;
  const router = useRouter();
  const viewRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<PageZoom | null>(null);

  // The left page that was showing when the last turn ended. While the
  // address points somewhere else, the cover or a page is turning there
  const [settledPageIndex, setSettledPageIndex] = useState(leftPageIndex);
  const isTurning = settledPageIndex !== leftPageIndex;

  function handlePreviousPages() {
    if (!isTurning) onPreviousPages();
  }

  function handleNextPages() {
    if (!isTurning) onNextPages();
  }

  // Zooms the whole view onto the clicked page, growing and sliding at once
  // so its paper lands exactly where the editor draws it, then opens the
  // editor. With reduced motion it opens straight away and the page fades
  function handleOpenPage(pageId: string, paperRect: DOMRect) {
    const view = viewRef.current;
    if (isTurning || zoom || !view) return;
    markArrivingFromNotebookView();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(`/userNotebooks/${notebookId}/${pageId}`);
      return;
    }

    const viewRect = view.getBoundingClientRect();
    const editorPageRect = getEditorPageRect();
    setZoom({
      originX: paperRect.x - viewRect.x,
      originY: paperRect.y - viewRect.y,
      moveX: editorPageRect.x - paperRect.x,
      moveY: editorPageRect.y - paperRect.y,
      scale: editorPageRect.width / paperRect.width,
      pageId,
    });
  }

  function handleZoomEnd(event: React.TransitionEvent) {
    if (!zoom || event.target !== event.currentTarget) return;
    router.push(`/userNotebooks/${notebookId}/${zoom.pageId}`);
  }

  // Every page here is read-only, and clicking one opens it in the editor
  function renderPage(page: NotebookPageState | undefined) {
    return (
      <NotebookSheet
        page={page}
        paperType={paperType}
        onOpen={handleOpenPage}
      />
    );
  }

  // Should scale to fit the page without scrolling
  return (
    <div
      ref={viewRef}
      className="notebook-page-notebook-view"
      data-zooming={zoom !== null}
      onTransitionEnd={handleZoomEnd}
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          ...DEFAULT_TEXT_FORMAT_VARIABLES,
          "--notebook-scale": scale,
          ...(zoom && {
            "--zoom-origin-x": `${zoom.originX}px`,
            "--zoom-origin-y": `${zoom.originY}px`,
            "--zoom-move-x": `${zoom.moveX}px`,
            "--zoom-move-y": `${zoom.moveY}px`,
            "--zoom-scale": zoom.scale,
          }),
        } as React.CSSProperties
      }
    >
      <PageFlipButton
        direction="previous"
        label="Previous pages"
        disabled={isCoverShown}
        onClick={handlePreviousPages}
      />

      <Notebook
        notebook={currentNotebookState}
        leftPageIndex={leftPageIndex}
        settledPageIndex={settledPageIndex}
        renderPage={renderPage}
        onTurnEnd={() => setSettledPageIndex(leftPageIndex)}
      />

      <PageFlipButton
        direction="next"
        label="Next pages"
        onClick={handleNextPages}
      />
    </div>
  );
}
