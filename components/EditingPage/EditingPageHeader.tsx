import { ViewTransition } from "react";
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

      {/* The same name as the notebook view's title, so it stays still
          while the rest of the page crossfades */}
      <ViewTransition name="notebook-title">
        <h1 className="editing-page-header-notebook-title">{notebookTitle}</h1>
      </ViewTransition>
    </div>
  );
}
