"use client";

import type { NotebookState } from "@/types/notebook";
import { use, useEffect, useState } from "react";
import { NotebookHeaderBar } from "@/components/NotebookPage/NotebookHeaderBar";
import { Notebook } from "@/components/NotebookPage/Notebook";
import {
  updateNotebookTitle,
  getNotebook,
  addNotebookPage,
} from "@/data/notebookDB";
import { createEmptyNotebookPage } from "@/components/NotebookPage/createEmptyNotebookPage";

type NotebookPageProps = {
  params: Promise<{ notebookId: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookID.
 */

export default function NotebookPage({ params }: NotebookPageProps) {
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);

  // Index of the page on the left side of the open spread, always even
  const [leftPageIndex, setLeftPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // Gets the notebook ID from web link
  const { notebookId } = use(params);

  // Loads the notebook data from the database with the notebookID
  useEffect(() => {
    async function loadNotebook() {
      const savedNotebook = await getNotebook(notebookId);

      if (savedNotebook) {
        setCurrentNotebookState(savedNotebook);
      }
    }

    loadNotebook();
  }, [notebookId]);

  const handlePreviousSpread = () => {
    setLeftPageIndex((index) => Math.max(0, index - 2));
  };

  // Creates any missing pages up to the end of the next spread before flipping to it
  const handleNextSpread = async () => {
    if (!currentNotebookState || isFlipping) return;

    setIsFlipping(true);

    const nextLeftPageIndex = leftPageIndex + 2;
    const requiredPageCount = nextLeftPageIndex + 2;

    for (
      let pageCount = currentNotebookState.pages.length;
      pageCount < requiredPageCount;
      pageCount++
    ) {
      await addNotebookPage(notebookId, createEmptyNotebookPage(pageCount + 1));
    }

    const updatedNotebook = await getNotebook(notebookId);
    if (updatedNotebook) {
      setCurrentNotebookState(updatedNotebook);
    }

    setLeftPageIndex(nextLeftPageIndex);
    setIsFlipping(false);
  };

  // A loading state while the notebook data is being fetched from the database
  if (!currentNotebookState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="notebook-page">
      <NotebookHeaderBar
        notebookID={currentNotebookState.id}
        currentTitle={currentNotebookState.title}
        updateNotebookTitle={updateNotebookTitle}
      />

      <Notebook
        currentNotebookState={currentNotebookState}
        pages={[
          currentNotebookState.pages[leftPageIndex],
          currentNotebookState.pages[leftPageIndex + 1],
        ]}
        leftPageNumber={leftPageIndex + 1}
        scale={0.75}
        canFlipBack={leftPageIndex > 0}
        isFlipping={isFlipping}
        onPreviousSpread={handlePreviousSpread}
        onNextSpread={handleNextSpread}
      />
    </div>
  );
}
