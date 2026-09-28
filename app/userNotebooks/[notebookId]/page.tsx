"use client";

import type { NotebookState } from "@/types/notebook";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotebookHeaderBar } from "@/components/NotebookPage/NotebookHeaderBar";
import { Notebook } from "@/components/NotebookPage/Notebook";
import {
  updateNotebookTitle,
  getNotebook,
  addNotebookPage,
} from "@/data/notebookDB";
import { createEmptyNotebookPage } from "@/components/NotebookPage/createNotebookPages";
import {
  PAGE_PARAM,
  COVER_PAGE_INDEX,
  getLeftPageIndex,
  getNotebookPageHref,
  parseLeftPageIndex,
} from "@/components/NotebookPage/notebookPageUrl";

type NotebookPageProps = {
  params: Promise<{ notebookId: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookID.
 */

export default function NotebookPage({ params }: NotebookPageProps) {
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Replaces instead of pushing so flipping doesn't fill up the browser history
  const goToPages = (index: number) => {
    router.replace(getNotebookPageHref(notebookId, index), {
      scroll: false,
    });
  };

  // The page before the current left page belongs to the previous pair, or is the cover
  const handlePreviousPages = () => {
    goToPages(getLeftPageIndex(leftPageIndex - 1));
  };

  // Creates any missing pages in the next pair before flipping to it
  const handleNextPages = async () => {
    if (isFlipping) return;

    setIsFlipping(true);

    // The cover is a single page, every other pair is two
    const nextLeftPageIndex = leftPageIndex + (isCoverShown ? 1 : 2);
    const requiredPageCount = nextLeftPageIndex + 2;

    for (
      let pageCount = currentNotebookState.pages.length;
      pageCount < requiredPageCount;
      pageCount++
    ) {
      await addNotebookPage(notebookId, createEmptyNotebookPage(pageCount));
    }

    const updatedNotebook = await getNotebook(notebookId);
    if (updatedNotebook) {
      setCurrentNotebookState(updatedNotebook);
    }

    goToPages(nextLeftPageIndex);
    setIsFlipping(false);
  };

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
        leftPageNumber={leftPageIndex}
        scale={0.75}
        isCoverShown={isCoverShown}
        canFlipBack={!isCoverShown}
        isFlipping={isFlipping}
        onPreviousPages={handlePreviousPages}
        onNextPages={handleNextPages}
      />
    </div>
  );
}
