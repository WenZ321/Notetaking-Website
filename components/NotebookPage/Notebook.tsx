import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import type { NotebookPageState, NotebookState } from "@/types/notebook";
import NotebookSheet from "./NotebookSheet";
import "./Notebook.css";

type NotebookPreviewProps = {
  currentNotebookState: NotebookState;
  pages: [NotebookPageState | undefined, NotebookPageState | undefined];
  scale: number;
};

/**
 * The notebook view that shows a preview of the notebook pages two at a time
 */
export default function Notebook({
  currentNotebookState,
  pages,
  scale,
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
      <div className="notebook-page-frame">
        <div className="notebook-page-scaled">
          <NotebookSheet
            page={leftPage}
            notebookId={currentNotebookState.id}
            totalNotebookPages={currentNotebookState.totalPages}
          />
        </div>
      </div>

      <div className="notebook-page-frame">
        <div className="notebook-page-scaled">
          <NotebookSheet
            page={rightPage}
            notebookId={currentNotebookState.id}
            totalNotebookPages={currentNotebookState.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
