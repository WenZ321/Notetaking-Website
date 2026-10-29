"use client";

import type { NotebookState, NotebookCoverStyle } from "@/types/Notebook";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import "./TemplateTile.css";

type TemplateTileProps = {
  coverStyle: NotebookCoverStyle;
};

/**
 * A template tile showing a cover style's front, which creates a new notebook with that cover when clicked
 */
export function TemplateTile({ coverStyle }: TemplateTileProps) {
  const router = useRouter();
  const { label, className } = NOTEBOOK_COVER_STYLES[coverStyle];

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook() {
    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      coverStyle,
      // Every notebook is blank until users can choose the paper type
      paperType: "blank",
      pages: [
        createNotebookCover(),
        createEmptyNotebookPage(1),
        createEmptyNotebookPage(2),
      ],
    };

    await createNotebook(notebook);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/userNotebooks/${notebook.id}`);
  }

  return (
    <div className="user-notebooks-page-template-tile">
      <div className={`user-notebooks-page-template-tile-card ${className}`} />

      <button
        className="user-notebooks-page-template-tile-button"
        onClick={handleCreateNotebook}
      >
        {label}
      </button>
    </div>
  );
}
