import type { NotebookCoverStyle } from "@/types/Notebook";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { TemplateTile } from "./TemplateTile";
import "./TemplatePicker.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 */
export function TemplatePicker() {
  const coverStyles = Object.keys(
    NOTEBOOK_COVER_STYLES,
  ) as NotebookCoverStyle[];

  return (
    <section className="user-notebooks-page-template-picker">
      <div className="user-notebooks-page-template-picker-row">
        {coverStyles.map((coverStyle) => (
          <TemplateTile key={coverStyle} coverStyle={coverStyle} />
        ))}
      </div>
    </section>
  );
}
