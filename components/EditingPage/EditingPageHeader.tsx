import { LogoLink } from "../LogoLink";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookId: string;
  notebookTitle: string;
};

// Header bar for the editing page: logo/back link and notebook title.
export function EditingPageHeader({
  notebookId,
  notebookTitle,
}: EditingPageHeaderProps) {
  return (
    <div className="editing-page-header">
      <LogoLink pageLink={`/userNotebooks/${notebookId}`} />

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>
    </div>
  );
}
