import type { NotebookPaperType } from "@/types/Notebook";
import { NOTEBOOK_PAPER_TYPES } from "./NotebookPaperTypes";
import "./NotebookPaper.css";

type NotebookPaperProps = {
  paperType: NotebookPaperType;
};

/**
 * Draws a paper type's paper behind the page content, filling the nearest positioned parent.
 * That parent needs isolation: isolate, otherwise the paper hides behind the parent's own background
 */
export function NotebookPaper({ paperType }: NotebookPaperProps) {
  // Defaults to blank paper when the paper type is missing or no longer exists
  const { Paper } = NOTEBOOK_PAPER_TYPES[paperType] ?? NOTEBOOK_PAPER_TYPES.blank;

  return (
    <div className="notebook-paper">
      <Paper />
    </div>
  );
}
