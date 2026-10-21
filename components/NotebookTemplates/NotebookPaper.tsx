import type { NotebookTemplate } from "@/types/Notebook";
import { NOTEBOOK_TEMPLATES } from "./NotebookTemplates";
import "./NotebookPaper.css";

type NotebookPaperProps = {
  template: NotebookTemplate;
};

/**
 * Draws a template's paper behind the page content, filling the nearest positioned parent.
 * That parent needs isolation: isolate, otherwise the paper hides behind the parent's own background
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
