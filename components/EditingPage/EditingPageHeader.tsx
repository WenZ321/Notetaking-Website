import LogoLink from "../LogoLink";
import SaveContentButton from "./SaveContentButton";
import "./EditingPageHeader.css";

type EditingPageHeaderProps = {
  notebookId: string;
  notebookTitle: string;
  saveNotebookPageContent: () => void;
};

export default function EditingPageHeader({
  notebookId,
  notebookTitle,
  saveNotebookPageContent,
}: EditingPageHeaderProps) {
  return (
    <div className="editing-page-header">
      <LogoLink
        pageLink={`/userNotebooks/${notebookId}`}
        onClick={saveNotebookPageContent}
      />

      <h1 className="editing-page-header-notebook-title"> {notebookTitle} </h1>

      <SaveContentButton savePageContent={saveNotebookPageContent} />
    </div>
  );
}
