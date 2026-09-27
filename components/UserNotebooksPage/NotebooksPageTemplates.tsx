import type { NotebookTemplate } from "@/types/notebook";
import { NOTEBOOK_TEMPLATES } from "@/components/NotebookTemplates/notebookTemplates";
import { NotebooksPreviewTemplate } from "./NotebookPreviewTemplates/NotebooksPreviewTemplate";
import "./NotebooksPageTemplates.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export function NotebookPageTemplates() {
  const templates = Object.keys(NOTEBOOK_TEMPLATES) as NotebookTemplate[];

  return (
    <section className="user-notebooks-page-notebooks-page-templates-section">
      <div className="user-notebooks-page-notebooks-page-templates-container">
        {templates.map((template) => (
          <NotebooksPreviewTemplate key={template} template={template} />
        ))}
      </div>
    </section>
  );
}
