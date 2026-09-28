import { LogoLink } from "../LogoLink";
import {
  getNotebookPageHref,
  getLeftPageIndex,
} from "../NotebookPage/notebookPageUrl";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookId: string;
  notebookTitle: string;
  currentPageIndex: number;
};

// Header bar for the editing page: logo/back link and notebook title.
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
      <LogoLink pageLink={notebookHref} />

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>
    </div>
  );
}
