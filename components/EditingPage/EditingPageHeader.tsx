import { LogoLink } from "../LogoLink";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookTitle: string;
};

// Header bar for the editing page: the logo and the notebook's title
export function EditingPageHeader({ notebookTitle }: EditingPageHeaderProps) {
  return (
    <div className="editing-page-header">
      <LogoLink pageLink="/userNotebooks" />

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>
    </div>
  );
}
