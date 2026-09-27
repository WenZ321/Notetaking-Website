import type { NotebookTemplate } from "@/types/notebook";
import { NOTEBOOK_TEMPLATES } from "./notebookTemplates";
import "./NotebookPaper.css";

type NotebookPaperProps = {
  template: NotebookTemplate;
};

/**
 * Draws a template's paper behind the page content, filling the nearest positioned parent.
 * The parent needs isolation: isolate so the paper stays behind its content.
 */
export function NotebookPaper({ template }: NotebookPaperProps) {
  // Notebooks saved before templates existed have none, so they fall back to blank
  const { Paper } = NOTEBOOK_TEMPLATES[template] ?? NOTEBOOK_TEMPLATES.blank;

  return (
    <div className="notebook-paper">
      <Paper />
    </div>
  );
}
