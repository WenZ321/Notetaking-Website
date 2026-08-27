import "./NotebooksPageTemplates.css";
import NotebookTemplates1 from "./NotebookTemplates/NotebooksTemplates1";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export default function NotebookPageTemplates() {
  return (
    <section className="notebooks-page-templates-section">
      <div className="notebooks-page-templates-container">
        <NotebookTemplates1 />
        <NotebookTemplates1 />
        <NotebookTemplates1 />
        <NotebookTemplates1 />
      </div>
    </section>
  );
}
