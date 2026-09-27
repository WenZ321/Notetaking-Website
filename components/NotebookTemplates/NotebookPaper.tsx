import type { NotebookTemplate } from "@/types/notebook";
import { NOTEBOOK_TEMPLATES } from "./notebookTemplates";
import "./NotebookPaper.css";

type NotebookPaperProps = {
  template: NotebookTemplate;
};

/**
 * Draws a template's paper behind the page content
 */
export function NotebookPaper({ template }: NotebookPaperProps) {
  // Defaults to blank template when the template is missing or no longer exists
  const { Paper } = NOTEBOOK_TEMPLATES[template] ?? NOTEBOOK_TEMPLATES.blank;

  return (
    <div className="notebook-paper">
      <Paper />
    </div>
  );
}
