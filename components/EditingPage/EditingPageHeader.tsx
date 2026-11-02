import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoLink } from "../LogoLink";
import {
  getNotebookPageHref,
  getLeftPageIndex,
} from "../NotebookPage/NotebookPageUrl";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookId: string;
  notebookTitle: string;
  currentPageIndex: number;
};

// Header bar for the editing page: the logo, the way back to the notebook, and its title
export function EditingPageHeader({
  notebookId,
  notebookTitle,
  currentPageIndex,
}: EditingPageHeaderProps) {
  // Returns to the notebook opened to this page
  const notebookHref = getNotebookPageHref(
    notebookId,
    getLeftPageIndex(currentPageIndex),
  );

  return (
    <div className="editing-page-header">
      <LogoLink pageLink="/userNotebooks" />

      {/* Leaves editing, back to the notebook view */}
      <Link href={notebookHref} className="editing-page-header-back-link">
        <ArrowLeft className="editing-page-header-back-icon" />
        Notebook
      </Link>

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>
    </div>
  );
}
