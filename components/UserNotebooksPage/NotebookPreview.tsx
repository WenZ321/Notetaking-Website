import type { NotebookCoverStyle } from "@/types/Notebook";
import Link from "next/link";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import "./NotebookPreview.css";

type NotebookProps = {
  title: string;
  id: string;
  coverStyle: NotebookCoverStyle;
};

/**
 * One of the user's saved notebooks, standing spine-out on the library shelf.
 * Clicking on it takes users to the notebook page.
 */
export function NotebookPreview({ title, id, coverStyle }: NotebookProps) {
  const { className } = NOTEBOOK_COVER_STYLES[coverStyle];

  // The spine has no text on it yet, so the title names the link and shows when hovered
  return (
    <Link
      href={`/userNotebooks/${id}`}
      className={`user-notebooks-page-notebook-preview-spine ${className}`}
      aria-label={title}
      title={title}
    />
  );
}
