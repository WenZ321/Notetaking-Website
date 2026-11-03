import type { NotebookPageState, NotebookState } from "@/types/Notebook";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageFlipButton } from "../PageFlipButton";
import { Notebook } from "./Notebook";
import { NotebookSheet } from "./NotebookSheet";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import { NOTEBOOK_PAGE_VARIABLES } from "@/constants/NotebookPageConstants";
import { DEFAULT_TEXT_FORMAT_VARIABLES } from "@/constants/TextFormattingConstants";
import { getEditorPageRect } from "../EditingPage/EditorPageRect";
import { markArrivingFromNotebookView } from "../EditingPage/ArrivingFromNotebookView";
import {
  clearReturningFromEditor,
  getReturningFromEditor,
} from "./ReturningFromEditor";
import { NOTEBOOK_ZOOM_TRANSITION } from "./NotebookZoomTransition";
import "./NotebookView.css";

type NotebookViewProps = {
  currentNotebookState: NotebookState;
  leftPageIndex: number;
  scale: number;
  onPreviousPages: () => void;
  onNextPages: () => void;
};

// How the view moves to zoom onto a page: the point it grows from, in the
// view's own pixels, how far it slides, and how much it grows. It's zooming
// in toward the editor, or back from it, sitting zoomed onto the page and
// then pulling back out
type PageZoom = {
  originX: number;
  originY: number;
  moveX: number;
  moveY: number;
  scale: number;
  pageId: string;
  phase: "in" | "out-from" | "out";
};

// The zoom that puts a page's paper, now at paperRect, at targetRect
function getPageZoom(
  pageId: string,
  paperRect: DOMRect,
  viewRect: DOMRect,
  targetRect: DOMRect,
  phase: PageZoom["phase"],
): PageZoom {
  return {
    originX: paperRect.x - viewRect.x,
    originY: paperRect.y - viewRect.y,
    moveX: targetRect.x - paperRect.x,
    moveY: targetRect.y - paperRect.y,
    scale: targetRect.width / paperRect.width,
    pageId,
    phase,
  };
}

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

  // Back from the editor, the view starts zoomed onto the page right where
  // the editor left it, before it's first drawn, then pulls back out once
  // that's on screen. Read once, so later visits start still
  const [returning] = useState(getReturningFromEditor);
  useEffect(() => clearReturningFromEditor(), []);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const paper = view?.querySelector(`[data-page-id="${returning?.pageId}"]`);
    if (!returning || !view || !paper) return;
    setZoom(
      getPageZoom(
        returning.pageId,
        paper.getBoundingClientRect(),
        view.getBoundingClientRect(),
        returning.paperRect,
        "out-from",
      ),
    );
  }, [returning]);

  // Waits two frames, so the zoomed-in view has been drawn to pull back from
  useEffect(() => {
    if (zoom?.phase !== "out-from") return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setZoom({ ...zoom, phase: "out" }));
    });
    return () => cancelAnimationFrame(frame);
  }, [zoom]);

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
    markArrivingFromNotebookView(currentNotebookState);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(`/userNotebooks/${notebookId}/${pageId}`);
      return;
    }

    setZoom(
      getPageZoom(
        pageId,
        paperRect,
        view.getBoundingClientRect(),
        getEditorPageRect(),
        "in",
      ),
    );
  }

  // Zoomed in, the editor opens. Pulled back out, the view is itself again
  function handleZoomEnd(event: React.TransitionEvent) {
    if (!zoom || event.target !== event.currentTarget) return;
    if (zoom.phase === "in") {
      router.push(`/userNotebooks/${notebookId}/${zoom.pageId}`, {
        transitionTypes: [NOTEBOOK_ZOOM_TRANSITION],
      });
    } else {
      setZoom(null);
    }
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
      data-zooming={zoom?.phase ?? "none"}
      onTransitionEnd={handleZoomEnd}
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          ...DEFAULT_TEXT_FORMAT_VARIABLES,
          // grows with the screen like the interface around it
          "--notebook-scale": `calc(${scale} * var(--ui-scale))`,
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
