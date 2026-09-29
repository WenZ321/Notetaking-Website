"use client";

import type { NotebookState } from "@/types/notebook";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotebookHeaderBar } from "@/components/NotebookPage/NotebookHeaderBar";
import { Notebook } from "@/components/NotebookPage/Notebook";
import {
  updateNotebookTitle,
  getNotebook,
  ensurePagesExist,
} from "@/data/notebookDB";
import {
  PAGE_PARAM,
  getLeftPageIndex,
  getNotebookPageHref,
  parseLeftPageIndex,
} from "@/components/NotebookPage/notebookPageUrl";
import { COVER_PAGE_INDEX } from "@/data/createNotebookPages";

type NotebookPageProps = {
  params: Promise<{ notebookId: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookId.
 */
export default function NotebookPage({ params }: NotebookPageProps) {
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);
  const [isNotebookMissing, setIsNotebookMissing] = useState(false);
  const router = useRouter();
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
        setIsNotebookMissing(true);
      }
    }

    loadNotebook();
  }, [notebookId]);

  if (isNotebookMissing) {
    return <div>Notebook not found</div>;
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

      <Notebook
        currentNotebookState={currentNotebookState}
        leftPageIndex={leftPageIndex}
        scale={0.75}
        onPreviousPages={handlePreviousPages}
        onNextPages={handleNextPages}
      />
    </div>
  );
}
