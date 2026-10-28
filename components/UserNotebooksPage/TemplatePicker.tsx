import type { NotebookPaperType } from "@/types/Notebook";
import { NOTEBOOK_PAPER_TYPES } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import { TemplateTile } from "./TemplateTile";
import "./TemplatePicker.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export function TemplatePicker() {
  const paperTypes = Object.keys(NOTEBOOK_PAPER_TYPES) as NotebookPaperType[];

  return (
    <section className="user-notebooks-page-template-picker">
      <div className="user-notebooks-page-template-picker-row">
        {paperTypes.map((paperType) => (
          <TemplateTile key={paperType} paperType={paperType} />
        ))}
      </div>
    </section>
  );
}
