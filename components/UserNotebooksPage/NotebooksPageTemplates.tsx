import "./NotebooksPageTemplates.css";
import NotebookPreviewTemplateBlank from "./NotebookPreviewTemplates/NotebooksPreviewTemplatesBlank";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export default function NotebookPageTemplates() {
  return (
    <section className="user-notebooks-page-notebooks-page-templates-section">
      <div className="user-notebooks-page-notebooks-page-templates-container">
        <NotebookPreviewTemplateBlank />
        <NotebookPreviewTemplateBlank />
        <NotebookPreviewTemplateBlank />
        <NotebookPreviewTemplateBlank />
      </div>
    </section>
  );
}
