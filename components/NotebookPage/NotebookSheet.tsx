import type { NotebookPageState, NotebookTemplate } from "@/types/notebook";
import { useRouter } from "next/navigation";
import { TipTapContentRenderer } from "@/tiptap/TipTapContentRenderer/TipTapContentRenderer";
import { addNotebookPage } from "@/data/notebookDB";
import { NotebookPaper } from "../NotebookTemplates/NotebookPaper";
import "./NotebookSheet.css";

type NotebookPagePreviewProps = {
  page: NotebookPageState | undefined;
  notebookId: string;
  totalNotebookPages: number;
  template: NotebookTemplate;
};

/**
 * A representation of one notebook page in the notebook preview,
 * which is a read-only view of the page content.
 */
export function NotebookPage({
  page,
  notebookId,
  totalNotebookPages,
  template,
}: NotebookPagePreviewProps) {
  const router = useRouter();

  const handleEnterEditMode = async () => {
    if (page) {
      router.push(`/userNotebooks/${notebookId}/${page.id}`);
      return;
    }

    const newPage: NotebookPageState = {
      id: crypto.randomUUID(),
      pageNumber: totalNotebookPages + 1,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
      },
    };

    await addNotebookPage(notebookId, newPage);

    router.push(`/userNotebooks/${notebookId}/${newPage.id}`);
  };

  return (
    <div
      className="notebook-page-notebook-sheet-content"
      onClick={handleEnterEditMode}
    >
      <NotebookPaper template={template} />
      {page && <TipTapContentRenderer content={page.content} />}
    </div>
  );
}
