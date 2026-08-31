import LogoLink from "../LogoLink";
import SaveContentButton from "./SaveContentButton";

type EditingPageHeaderProps = {
  notebookId: string;
  saveNotebookPageContent: () => void;
};

export default function EditingPageHeader({
  notebookId,
  saveNotebookPageContent,
}: EditingPageHeaderProps) {
  return (
    <div className="editing-page-header">
      <LogoLink
        pageLink={`/notebooks/${notebookId}`}
        onClick={saveNotebookPageContent}
      />

      <SaveContentButton savePageContent={saveNotebookPageContent} />
    </div>
  );
}
