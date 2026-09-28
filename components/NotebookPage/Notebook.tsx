import type { NotebookState } from "@/types/notebook";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { PageFlipButton } from "../PageFlipButton";
import { NotebookSheet } from "./NotebookSheet";
import { NotebookCover } from "./NotebookCover";
import { COVER_PAGE_INDEX } from "./notebookPageUrl";
import "./Notebook.css";

type NotebookPreviewProps = {
  currentNotebookState: NotebookState;
  leftPageIndex: number;
  scale: number;
  isFlipping: boolean;
  onPreviousPages: () => void;
  onNextPages: () => void;
};

/**
 * The notebook view that shows a preview of the notebook pages two at a time
 */
export function Notebook({
  currentNotebookState,
  leftPageIndex,
  scale,
  isFlipping,
  onPreviousPages,
  onNextPages,
}: NotebookPreviewProps) {
  const leftPage = currentNotebookState.pages[leftPageIndex];
  const rightPage = currentNotebookState.pages[leftPageIndex + 1];
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;

  // Should scale to fit the page without scrolling
  return (
    <div
      className="notebook-page-notebook-view"
      style={
        {
          "--notebook-view-scale": scale,
          "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
          "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
        } as React.CSSProperties
      }
    >
      <PageFlipButton
        direction="previous"
        label="Previous pages"
        disabled={isCoverShown || isFlipping}
        onClick={onPreviousPages}
      />

      {isCoverShown ? (
        <NotebookCover />
      ) : (
        <div className="notebook-page-hardcover">
          <div className="notebook-page-frame">
            <div className="notebook-page-scaled">
              <NotebookSheet
                page={leftPage}
                notebookId={currentNotebookState.id}
                template={currentNotebookState.template}
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
        onClick={onNextPages}
      />
    </div>
  );
}
