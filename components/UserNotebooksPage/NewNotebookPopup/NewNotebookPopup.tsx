"use client";

import type {
  NotebookState,
  NotebookCoverStyle,
  NotebookPaperType,
} from "@/types/Notebook";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { OpeningNotebook } from "./OpeningNotebook";

type NewNotebookPopupProps = {
  coverStyle: NotebookCoverStyle;
  startRect: DOMRect; // Where the chosen cover sits on screen, so the notebook opens from there
  onClose: () => void;
};

/**
 * The chosen cover opening in the middle of the page, where the user names
 * the new notebook and picks its paper, then creates it
 */
export function NewNotebookPopup({
  coverStyle,
  startRect,
  onClose,
}: NewNotebookPopupProps) {
  const router = useRouter();
  // A second click while the first notebook is still saving would make a copy
  const isCreatingRef = useRef(false);

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook(
    title: string,
    paperType: NotebookPaperType,
  ) {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title,
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
    <OpeningNotebook
      coverStyle={coverStyle}
      startRect={startRect}
      onCreate={handleCreateNotebook}
      onClose={onClose}
    />
  );
}
