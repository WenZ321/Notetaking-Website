"use client";

import type {
  NotebookState,
  NotebookCoverStyle,
  NotebookPaperType,
} from "@/types/Notebook";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { PaperTypePicker } from "./PaperTypePicker";
import "./TemplateTile.css";

type TemplateTileProps = {
  coverStyle: NotebookCoverStyle;
};

/**
 * A template tile showing a cover style's front. Clicking it asks for a paper type,
 * then creates a new notebook with that cover and paper
 */
export function TemplateTile({ coverStyle }: TemplateTileProps) {
  const router = useRouter();
  const [isPaperTypePickerOpen, setIsPaperTypePickerOpen] = useState(false);
  const { label, className } = NOTEBOOK_COVER_STYLES[coverStyle];

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook(paperType: NotebookPaperType) {
    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      coverStyle,
      paperType,
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
        onClick={() => setIsPaperTypePickerOpen(true)}
      >
        {label}
      </button>

      {isPaperTypePickerOpen && (
        <PaperTypePicker
          onPick={handleCreateNotebook}
          onClose={() => setIsPaperTypePickerOpen(false)}
        />
      )}
    </div>
  );
}
