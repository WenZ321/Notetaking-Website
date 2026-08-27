import type { NotebookPageState } from "@/types/notebook";
import { tiptapJsonToHtml } from "@/tiptap/TipTapUtils";
import { addNotebookPage } from "@/data/notebookDB";
import { useRouter } from "next/navigation";
import "./NotebookPagePreview.css";

type NotebookPagePreviewProps = {
  page: NotebookPageState | undefined;
  notebookId: string;
  totalNotebookPages: number;
};

/**
 * A representation of one notebook page in the notebook preview,
 * which is a read-only view of the page content.
 */
export default function NotebookPagePreview({
  page,
  notebookId,
  totalNotebookPages,
}: NotebookPagePreviewProps) {
  const router = useRouter();

  const handleEnterEditMode = async () => {
    if (page) {
      console.log(`/notebooks/${notebookId}/${page.id}`);
      router.push(`/notebooks/${notebookId}/${page.id}`);
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
          },
        ],
      },
    };

    await addNotebookPage(notebookId, newPage);

    console.log(`/notebooks/${notebookId}/${newPage.id}`);
    router.push(`/notebooks/${notebookId}/${newPage.id}`);
  };

  const html = page ? tiptapJsonToHtml(page.content) : "";

  return (
    <div
      className="notebook-page-content"
      onClick={handleEnterEditMode}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
