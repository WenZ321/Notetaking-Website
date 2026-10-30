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
import { MIDDLE_REACH, getCoverSide } from "./TemplateCarouselLayout";
import "./TemplateTile.css";

type TemplateTileProps = {
  coverStyle: NotebookCoverStyle;
  offset: number; // Places from the center cover, negative to the left
};

/**
 * A template tile showing a cover style's front. Clicking it asks for a paper type,
 * then creates a new notebook with that cover and paper
 */
export function TemplateTile({ coverStyle, offset }: TemplateTileProps) {
  const router = useRouter();
  const [isPaperTypePickerOpen, setIsPaperTypePickerOpen] = useState(false);
  const { label, className } = NOTEBOOK_COVER_STYLES[coverStyle];

  const side = getCoverSide(offset);
  // How many places past the middle a side cover sits, 0 for middle covers
  const depth = side === "middle" ? 0 : Math.abs(offset) - MIDDLE_REACH;

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
    <>
      <button
        className={`user-notebooks-page-template-tile-cover ${className}`}
        data-side={side}
        style={
          {
            "--cover-offset": offset,
            "--cover-depth": depth,
          } as React.CSSProperties
        }
        aria-label={label}
        onClick={() => setIsPaperTypePickerOpen(true)}
      />

      {isPaperTypePickerOpen && (
        <PaperTypePicker
          onPick={handleCreateNotebook}
          onClose={() => setIsPaperTypePickerOpen(false)}
        />
      )}
    </>
  );
}
