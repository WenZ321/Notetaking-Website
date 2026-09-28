import type { NotebookPageState, NotebookTemplate } from "@/types/notebook";
import { useRouter } from "next/navigation";
import { TipTapContentRenderer } from "@/tiptap/TipTapContentRenderer/TipTapContentRenderer";
import { NotebookPaper } from "../NotebookTemplates/NotebookPaper";
import "./NotebookSheet.css";

type NotebookSheetProps = {
  page: NotebookPageState | undefined;
  notebookId: string;
  template: NotebookTemplate;
  side: "left" | "right";
};

/**
 * One page in the notebook view, a read-only view of its content that opens the editor when clicked
 */
export function NotebookSheet({
  page,
  notebookId,
  template,
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
      <NotebookPaper template={template} />
      {page && <TipTapContentRenderer content={page.content} />}

      {page && (
        <span className={`notebook-page-number notebook-page-number-${side}`}>
          {page.pageNumber}
        </span>
      )}
    </div>
  );
}
