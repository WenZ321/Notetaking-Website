import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoLink } from "../LogoLink";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookTitle: string;
  notebookHref: string;
  onLeave: () => void;
};

// Header bar for the editing page: the logo, the way back to the notebook, and its title
export function EditingPageHeader({
  notebookTitle,
  notebookHref,
  onLeave,
}: EditingPageHeaderProps) {
  // A plain click leaves through the editing page, which moves out of the
  // way first. Opening it in a new tab still works like any link
  const handleClick = (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    onLeave();
  };

  return (
    <div className="editing-page-header">
      <LogoLink pageLink="/userNotebooks" />

      {/* Leaves editing, back to the notebook view */}
      <Link
        href={notebookHref}
        className="editing-page-header-back-link"
        onClick={handleClick}
      >
        <ArrowLeft className="editing-page-header-back-icon" />
        Notebook
      </Link>

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>
    </div>
  );
}
