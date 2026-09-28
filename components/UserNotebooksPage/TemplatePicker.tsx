import type { NotebookTemplate } from "@/types/notebook";
import { NOTEBOOK_TEMPLATES } from "@/components/NotebookTemplates/notebookTemplates";
import { TemplateTile } from "./TemplateTile";
import "./TemplatePicker.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export function TemplatePicker() {
  const templates = Object.keys(NOTEBOOK_TEMPLATES) as NotebookTemplate[];

  return (
    <section className="user-notebooks-page-template-picker">
      <div className="user-notebooks-page-template-picker-row">
        {templates.map((template) => (
          <TemplateTile key={template} template={template} />
        ))}
      </div>
    </section>
  );
}
