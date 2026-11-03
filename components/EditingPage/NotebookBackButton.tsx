import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import "./NotebookBackButton.css";

type NotebookBackButtonProps = {
  notebookHref: string;
  onLeave: () => void;
};

/**
 * A round button just under the toolbar, at the notebook's top left, that
 * leaves editing for the notebook view. Faint until it's pointed at
 */
export function NotebookBackButton({
  notebookHref,
  onLeave,
}: NotebookBackButtonProps) {
  // A plain click leaves through the editing page, which moves out of the
  // way first. Opening it in a new tab still works like any link
  const handleClick = (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    onLeave();
  };

  return (
    <div className="editing-page-back">
      <Link
        href={notebookHref}
        className="editing-page-back-button"
        aria-label="Back to notebook"
        onClick={handleClick}
      >
        <ArrowLeft />
      </Link>
    </div>
  );
}
