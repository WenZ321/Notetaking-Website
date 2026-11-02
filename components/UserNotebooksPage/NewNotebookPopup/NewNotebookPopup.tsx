"use client";

import type {
  NotebookState,
  NotebookCoverStyle,
  NotebookPaperType,
  NotebookSummary,
} from "@/types/Notebook";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { useCreatingNotebook } from "../CreatingNotebook";
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
  // Called once the new notebook has landed on the table
  const finishFlightRef = useRef<(() => void) | null>(null);

  const { setCreating } = useCreatingNotebook();

  // The notebook being created, and whether the bookshelf's 3D copy has
  // taken over from the closed cover
  const [newNotebook, setNewNotebook] = useState<NotebookSummary | null>(null);
  const [isFlying, setIsFlying] = useState(false);

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook.
  // It navigates once both the save and the flight are done
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

    setNewNotebook({ id: notebook.id, title, coverStyle, paperType });
    const hasLanded = new Promise<void>((resolve) => {
      finishFlightRef.current = resolve;
    });
    await Promise.all([createNotebook(notebook), hasLanded]);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/userNotebooks/${notebook.id}`);
  }

  // The bookshelf flies the closed cover down onto the table. With reduced
  // motion there's no flight, so it's done once the popup has faded out
  function handleClosedToCreate(coverRect: DOMRect) {
    if (
      !newNotebook ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      finishFlightRef.current?.();
      return;
    }
    setCreating({
      notebook: newNotebook,
      coverRect,
      onFlightStart: () => setIsFlying(true),
      onLanded: () => finishFlightRef.current?.(),
    });
  }

  // the bookshelf's 3D copy takes over from the closed cover once it's flying
  if (isFlying) return null;
  return (
    <OpeningNotebook
      coverStyle={coverStyle}
      startRect={startRect}
      onCreate={handleCreateNotebook}
      onClosedToCreate={handleClosedToCreate}
      onClose={onClose}
    />
  );
}
