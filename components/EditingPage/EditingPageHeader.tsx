import LogoLink from "../LogoLink";

type EditingPageHeaderProps = {
  notebookId: string;
};

export default function EditingPageHeader({
  notebookId,
}: EditingPageHeaderProps) {
  return (
    <div className="editing-page-header">
      <LogoLink pageLink={`/notebooks/${notebookId}`} />
    </div>
  );
}
