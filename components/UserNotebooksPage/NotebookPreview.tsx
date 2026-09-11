import Link from "next/link";
import "./NotebookPreview.css";

type NotebookProps = {
  title: string;
  id: string;
};

/**
 * A notebook preview of the user's saved notebooks, showing the title and the cover page of the notebook.
 * Clicking on the preview will take users to the notebook page.
 */
export function NotebookPreview({ title, id }: NotebookProps) {
  return (
    <Link
      href={`/userNotebooks/${id}`}
      className="user-notebooks-page-notebook-preview-container"
    >
      <div className="user-notebooks-page-notebook-preview-title">
        <h3>{title}</h3>
      </div>

      <div className="user-notebooks-page-notebook-preview"></div>
    </Link>
  );
}
