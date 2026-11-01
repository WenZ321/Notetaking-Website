import type { NotebookCoverStyle } from "@/types/Notebook";
import Link from "next/link";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
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
  // The spine has no text on it yet, so the title names the link and shows when hovered
  return (
    <Link
      href={`/userNotebooks/${id}`}
      className="user-notebooks-page-notebook-preview-spine"
      style={getCoverColorVariables(coverStyle)}
      aria-label={title}
      title={title}
    />
  );
}
