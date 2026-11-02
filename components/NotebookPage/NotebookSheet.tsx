import type { NotebookPageState, NotebookPaperType } from "@/types/Notebook";
import { TipTapContentRenderer } from "@/tiptap/TipTapContentRenderer/TipTapContentRenderer";
import { NotebookPaper } from "../NotebookPaperTypes/NotebookPaper";
import "./NotebookSheet.css";

type NotebookSheetProps = {
  page: NotebookPageState | undefined;
  paperType: NotebookPaperType;
  side: "left" | "right";
  // opens this page in the editor, from where its paper is on screen
  onOpen: (pageId: string, paperRect: DOMRect) => void;
};

/**
 * One page in the notebook view, a read-only view of its content that opens the editor when clicked
 */
export function NotebookSheet({
  page,
  paperType,
  side,
  onOpen,
}: NotebookSheetProps) {
  // Every visible page already exists, since notebooks start with the cover and pages 1 and 2
  // and flipping forward creates the rest
  const handleEnterEditMode = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!page) return;
    onOpen(page.id, event.currentTarget.getBoundingClientRect());
  };

  return (
    <div
      className="notebook-page-notebook-sheet-content notebook-page-text"
      onClick={handleEnterEditMode}
    >
      <NotebookPaper paperType={paperType} />
      {page && <TipTapContentRenderer content={page.content} />}

      {page && (
        <span className={`notebook-page-number notebook-page-number-${side}`}>
          {page.pageNumber}
        </span>
      )}
    </div>
  );
}
