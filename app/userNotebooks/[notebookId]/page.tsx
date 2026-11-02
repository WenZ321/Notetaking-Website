"use client";

import type { NotebookState } from "@/types/Notebook";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NotebookHeaderBar } from "@/components/NotebookPage/NotebookHeaderBar";
import { NotebookView } from "@/components/NotebookPage/NotebookView";
import {
  updateNotebookTitle,
  getNotebook,
  ensurePagesExist,
} from "@/data/NotebookDB";
import {
  PAGE_PARAM,
  getLeftPageIndex,
  getNotebookPageHref,
  parseLeftPageIndex,
} from "@/components/NotebookPage/NotebookPageUrl";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import { NOTEBOOK_VIEW_SCALE } from "@/constants/NotebookPageConstants";

type NotebookPageProps = {
  params: Promise<{ notebookId: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookId.
 */
export default function NotebookPage({ params }: NotebookPageProps) {
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);
  // Why the notebook can't be shown, or null while it's fine
  const [loadProblem, setLoadProblem] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Gets the notebook ID from web link
  const { notebookId } = use(params);

  // Loads the notebook data from the database with the notebookId
  useEffect(() => {
    async function loadNotebook() {
      const savedNotebook = await getNotebook(notebookId);

      if (savedNotebook) {
        setCurrentNotebookState(savedNotebook);
      } else {
        setLoadProblem("Notebook not found");
      }
    }

    loadNotebook().catch((error) => {
      console.error("Failed to load notebook", error);
      setLoadProblem("Couldn't open this notebook");
    });
  }, [notebookId]);

  if (loadProblem) {
    return <div>{loadProblem}</div>;
  }

  // A loading state while the notebook data is being fetched from the database
  if (!currentNotebookState) {
    return <div>Loading...</div>;
  }

  // The open pages come from the page number in the URL
  const leftPageIndex = parseLeftPageIndex(
    searchParams.get(PAGE_PARAM),
    currentNotebookState.pages.length,
  );
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;

  // Replaces instead of pushing so flipping doesn't fill up the browser history.
  // It only changes the address, without the page change fade, so the notebook
  // stays put while its cover and pages turn
  const goToPages = (index: number) => {
    window.history.replaceState(
      null,
      "",
      getNotebookPageHref(notebookId, index),
    );
  };

  // The page before the current left page belongs to the previous pair, or is the cover
  const handlePreviousPages = () => {
    goToPages(getLeftPageIndex(leftPageIndex - 1));
  };

  // Creates any missing pages in the next pair before flipping to it
  const handleNextPages = async () => {
    // The cover is a single page, every other pair is two
    const nextLeftPageIndex = leftPageIndex + (isCoverShown ? 1 : 2);
    const nextRightPageIndex = nextLeftPageIndex + 1;

    const updatedNotebook = await ensurePagesExist(
      notebookId,
      nextRightPageIndex,
    );
    setCurrentNotebookState(updatedNotebook);

    goToPages(nextLeftPageIndex);
  };

  return (
    <div className="notebook-page">
      <NotebookHeaderBar
        notebookId={currentNotebookState.id}
        currentTitle={currentNotebookState.title}
        updateNotebookTitle={updateNotebookTitle}
      />

      <NotebookView
        currentNotebookState={currentNotebookState}
        leftPageIndex={leftPageIndex}
        scale={NOTEBOOK_VIEW_SCALE}
        onPreviousPages={handlePreviousPages}
        onNextPages={handleNextPages}
      />
    </div>
  );
}
