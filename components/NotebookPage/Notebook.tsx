import type { NotebookState } from "@/types/Notebook";
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

// The first two pages, the ones right under the cover
const FIRST_PAGES_INDEX = COVER_PAGE_INDEX + 1;

/**
 * The notebook view, showing the closed cover or two pages at a time with arrows to flip between them.
 * The cover turns open and closed, and the arrows wait while it turns
 */
export function Notebook({
  currentNotebookState,
  leftPageIndex,
  scale,
  onPreviousPages,
  onNextPages,
}: NotebookProps) {
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;
  const [isCoverTurning, setIsCoverTurning] = useState(false);

  // While closed, the first two pages already lie under the cover
  const shownLeftPageIndex = isCoverShown ? FIRST_PAGES_INDEX : leftPageIndex;
  const leftPage = currentNotebookState.pages[shownLeftPageIndex];
  const rightPage = currentNotebookState.pages[shownLeftPageIndex + 1];

  // Going back from the first pages closes the cover
  function handlePreviousPages() {
    if (isCoverTurning) return;
    if (leftPageIndex === FIRST_PAGES_INDEX) setIsCoverTurning(true);
    onPreviousPages();
  }

  function handleNextPages() {
    if (isCoverTurning) return;
    if (isCoverShown) setIsCoverTurning(true);
    onNextPages();
  }

  // The cover's turn has ended, or with reduced motion, its fade
  function handleCoverTurnEnd(
    event: React.TransitionEvent | React.AnimationEvent,
  ) {
    if (event.target === event.currentTarget) setIsCoverTurning(false);
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
        onAnimationEnd={handleCoverTurnEnd}
      >
        <div className="notebook-page-back-cover">
          <div className="notebook-page-frame">
            <div className="notebook-page-scaled">
              <NotebookSheet
                page={rightPage}
                notebookId={currentNotebookState.id}
                paperType={currentNotebookState.paperType}
                side="right"
              />
            </div>
          </div>
        </div>

        <div
          className="notebook-page-front-cover"
          onTransitionEnd={handleCoverTurnEnd}
        >
          <div className="notebook-page-cover-outside" />
          <div className="notebook-page-cover-inside">
            <div className="notebook-page-frame">
              <div className="notebook-page-scaled">
                <NotebookSheet
                  page={leftPage}
                  notebookId={currentNotebookState.id}
                  paperType={currentNotebookState.paperType}
                  side="left"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFlipButton
        direction="next"
        label="Next pages"
        onClick={handleNextPages}
      />
    </div>
  );
}
