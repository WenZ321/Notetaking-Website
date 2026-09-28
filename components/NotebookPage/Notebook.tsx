import type { NotebookState } from "@/types/notebook";
import { PageFlipButton } from "../PageFlipButton";
import { NotebookSheet } from "./NotebookSheet";
import { NotebookCover } from "./NotebookCover";
import { COVER_PAGE_INDEX } from "@/data/createNotebookPages";
import "./Notebook.css";

type NotebookProps = {
  currentNotebookState: NotebookState;
  leftPageIndex: number;
  scale: number;
  isCreatingPages: boolean;
  onPreviousPages: () => void;
  onNextPages: () => void;
};

/**
 * The notebook view, showing the closed cover or two pages at a time with arrows to flip between them
 */
export function Notebook({
  currentNotebookState,
  leftPageIndex,
  scale,
  isCreatingPages,
  onPreviousPages,
  onNextPages,
}: NotebookProps) {
  const leftPage = currentNotebookState.pages[leftPageIndex];
  const rightPage = currentNotebookState.pages[leftPageIndex + 1];
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;

  // Should scale to fit the page without scrolling
  return (
    <div
      className="notebook-page-notebook-view"
      style={{ "--notebook-view-scale": scale } as React.CSSProperties}
    >
      <PageFlipButton
        direction="previous"
        label="Previous pages"
        disabled={isCoverShown || isCreatingPages}
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
        disabled={isCreatingPages}
        onClick={onNextPages}
      />
    </div>
  );
}
