import type { NotebookPageState, NotebookState } from "@/types/notebook";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { PageFlipButton } from "../PageFlipButton/PageFlipButton";
import { NotebookSheet } from "./NotebookSheet";
import { NotebookCover } from "./NotebookCover";
import "./Notebook.css";

type NotebookPreviewProps = {
  currentNotebookState: NotebookState;
  pages: [NotebookPageState | undefined, NotebookPageState | undefined];
  leftPageNumber: number;
  scale: number;
  isCoverShown: boolean;
  canFlipBack: boolean;
  isFlipping: boolean;
  onPreviousSpread: () => void;
  onNextSpread: () => void;
};

/**
 * The notebook view that shows a preview of the notebook pages two at a time
 */
export function Notebook({
  currentNotebookState,
  pages,
  leftPageNumber,
  scale,
  isCoverShown,
  canFlipBack,
  isFlipping,
  onPreviousSpread,
  onNextSpread,
}: NotebookPreviewProps) {
  const [leftPage, rightPage] = pages;
  // Should scale to fit the page without scrolling
  return (
    <div
      className="notebook-page-notebook-view"
      style={
        {
          "--notebook-page-notebook-view": scale,
          "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
          "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
        } as React.CSSProperties
      }
    >
      <PageFlipButton
        direction="previous"
        label="Previous pages"
        disabled={!canFlipBack || isFlipping}
        onClick={onPreviousSpread}
      />

      {isCoverShown ? (
        <NotebookCover />
      ) : (
        <div className="notebook-page-cover">
          <div className="notebook-page-frame">
            <div className="notebook-page-scaled">
              <NotebookSheet
                page={leftPage}
                notebookId={currentNotebookState.id}
                template={currentNotebookState.template}
                pageNumber={leftPageNumber}
                side="left"
              />
            </div>
          </div>

          <div className="notebook-page-frame">
            <div className="notebook-page-scaled">
              <NotebookSheet
                page={rightPage}
                notebookId={currentNotebookState.id}
                template={currentNotebookState.template}
                pageNumber={leftPageNumber + 1}
                side="right"
              />
            </div>
          </div>
        </div>
      )}

      <PageFlipButton
        direction="next"
        label="Next pages"
        disabled={isFlipping}
        onClick={onNextSpread}
      />
    </div>
  );
}
