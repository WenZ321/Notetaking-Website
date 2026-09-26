import { NotebooksPreviewTemplatesBlank } from "./NotebookPreviewTemplates/NotebooksPreviewTemplatesBlank";
import "./NotebooksPageTemplates.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export function NotebookPageTemplates() {
  return (
    <section className="user-notebooks-page-notebooks-page-templates-section">
      <div className="user-notebooks-page-notebooks-page-templates-container">
        <NotebooksPreviewTemplatesBlank />
        <NotebooksPreviewTemplatesBlank />
        <NotebooksPreviewTemplatesBlank />
        <NotebooksPreviewTemplatesBlank />
        <NotebooksPreviewTemplatesBlank />
        <NotebooksPreviewTemplatesBlank />
      </div>
    </section>
  );
}
