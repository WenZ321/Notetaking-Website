import type { NotebookPageState, NotebookPaperType } from "@/types/Notebook";
import { useRouter } from "next/navigation";
import { TipTapContentRenderer } from "@/tiptap/TipTapContentRenderer/TipTapContentRenderer";
import { NotebookPaper } from "../NotebookPaperTypes/NotebookPaper";
import "./NotebookSheet.css";

type NotebookSheetProps = {
  page: NotebookPageState | undefined;
  notebookId: string;
  paperType: NotebookPaperType;
  side: "left" | "right";
};

/**
 * One page in the notebook view, a read-only view of its content that opens the editor when clicked
 */
export function NotebookSheet({
  page,
  notebookId,
  paperType,
  side,
}: NotebookSheetProps) {
  const router = useRouter();

  // Every visible page already exists, since notebooks start with the cover and pages 1 and 2
  // and flipping forward creates the rest
  const handleEnterEditMode = () => {
    if (!page) return;

    router.push(`/userNotebooks/${notebookId}/${page.id}`);
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
