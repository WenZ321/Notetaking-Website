import type {
  NotebookPageState,
  NotebookPaperType,
  NotebookState,
} from "@/types/Notebook";
import { useState } from "react";
import { PageFlipButton } from "../PageFlipButton";
import { NotebookSheet } from "./NotebookSheet";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import { NOTEBOOK_PAGE_VARIABLES } from "@/constants/NotebookPageConstants";
import { DEFAULT_TEXT_FORMAT_VARIABLES } from "@/constants/TextFormattingConstants";
import "./Notebook.css";

type NotebookProps = {
  currentNotebookState: NotebookState;
  leftPageIndex: number;
  scale: number;
  onPreviousPages: () => void;
  onNextPages: () => void;
};

type PageFrameProps = {
  page: NotebookPageState | undefined;
  notebookId: string;
  paperType: NotebookPaperType;
  side: "left" | "right";
};

// The first two pages, the ones right under the cover
const FIRST_PAGES_INDEX = COVER_PAGE_INDEX + 1;

// One page in its frame, drawn at the notebook view's scale
function PageFrame({ page, notebookId, paperType, side }: PageFrameProps) {
  return (
    <div className="notebook-page-frame">
      <div className="notebook-page-scaled">
        <NotebookSheet
          page={page}
          notebookId={notebookId}
          paperType={paperType}
          side={side}
        />
      </div>
    </div>
  );
}

/**
 * The notebook view, showing the closed cover or two pages at a time with arrows to flip between them.
 * The cover and the pages turn over on the spine, and the arrows wait while they turn
 */
export function Notebook({
  currentNotebookState,
  leftPageIndex,
  scale,
  onPreviousPages,
  onNextPages,
}: NotebookProps) {
  const { id: notebookId, pages, paperType } = currentNotebookState;
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;

  // The left page that was showing when the last turn ended. While the
  // address points somewhere else, the cover or a page is turning there
  const [settledPageIndex, setSettledPageIndex] = useState(leftPageIndex);
  const isTurning = settledPageIndex !== leftPageIndex;
  const isCoverTurning =
    isTurning && (isCoverShown || settledPageIndex === COVER_PAGE_INDEX);
  const pageTurnDirection =
    isTurning && !isCoverTurning
      ? leftPageIndex > settledPageIndex
        ? "next"
        : "previous"
      : null;

  // While closed, the first two pages already lie under the cover. While a
  // page turns, the side it leaves still shows the old page until it's
  // covered, and the side it uncovers already shows the new one
  let shownLeftPageIndex = isCoverShown ? FIRST_PAGES_INDEX : leftPageIndex;
  let shownRightPageIndex = shownLeftPageIndex + 1;
  if (pageTurnDirection === "next") shownLeftPageIndex = settledPageIndex;
  if (pageTurnDirection === "previous") {
    shownRightPageIndex = settledPageIndex + 1;
  }

  // The turning page has the page it leaves on its front, and the page it
  // lands as on its back
  const turningFrontIndex =
    pageTurnDirection === "next" ? settledPageIndex + 1 : settledPageIndex;
  const turningBackIndex =
    pageTurnDirection === "next" ? leftPageIndex : leftPageIndex + 1;

  function handlePreviousPages() {
    if (!isTurning) onPreviousPages();
  }

  function handleNextPages() {
    if (!isTurning) onNextPages();
  }

  // The cover or a page has finished turning, or with reduced motion, fading
  function handleTurnEnd(event: React.TransitionEvent | React.AnimationEvent) {
    if (event.target === event.currentTarget) {
      setSettledPageIndex(leftPageIndex);
    }
  }

  // Should scale to fit the page without scrolling
  return (
    <div
      className="notebook-page-notebook-view"
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          ...DEFAULT_TEXT_FORMAT_VARIABLES,
          "--notebook-view-scale": scale,
        } as React.CSSProperties
      }
    >
      <PageFlipButton
        direction="previous"
        label="Previous pages"
        disabled={isCoverShown}
        onClick={handlePreviousPages}
      />

      <div
        className="notebook-page-hardcover"
        data-open={!isCoverShown}
        style={getCoverColorVariables(currentNotebookState.coverStyle)}
        onAnimationEnd={handleTurnEnd}
      >
        <div className="notebook-page-back-cover">
          <PageFrame
            page={pages[shownRightPageIndex]}
            notebookId={notebookId}
            paperType={paperType}
            side="right"
          />
        </div>

        <div
          className="notebook-page-front-cover"
          onTransitionEnd={handleTurnEnd}
        >
          <div className="notebook-page-cover-outside" />
          <div className="notebook-page-cover-inside">
            <PageFrame
              page={pages[shownLeftPageIndex]}
              notebookId={notebookId}
              paperType={paperType}
              side="left"
            />
          </div>
        </div>

        {pageTurnDirection && (
          <div
            key={`${settledPageIndex}-${leftPageIndex}`}
            className="notebook-page-turning-page"
            data-direction={pageTurnDirection}
            onAnimationEnd={handleTurnEnd}
          >
            <div className="notebook-page-turning-page-front">
              <PageFrame
                page={pages[turningFrontIndex]}
                notebookId={notebookId}
                paperType={paperType}
                side={pageTurnDirection === "next" ? "right" : "left"}
              />
            </div>
            <div className="notebook-page-turning-page-back">
              <PageFrame
                page={pages[turningBackIndex]}
                notebookId={notebookId}
                paperType={paperType}
                side={pageTurnDirection === "next" ? "left" : "right"}
              />
            </div>
          </div>
        )}
      </div>

      <PageFlipButton
        direction="next"
        label="Next pages"
        onClick={handleNextPages}
      />
    </div>
  );
}
