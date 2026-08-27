"use client";
import { use, useEffect, useState } from "react";
import NotebookMenuBar from "@/components/NotebookPreview/NotebookMenuBar";
import NotebookView from "@/components/NotebookPreview/NotebookPreview";
import { updateNotebookTitle, getNotebook } from "@/data/notebookDB";
import type { NotebookState } from "@/types/notebook";

type NotebookPageProps = {
  params: Promise<{ notebookId: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookID.
 */

export default function NotebookPage({ params }: NotebookPageProps) {
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);

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

  return (
    <div className="notebook-page">
      <NotebookMenuBar
        notebookID={currentNotebookState.id}
        currentTitle={currentNotebookState.title}
        updateNotebookTitle={updateNotebookTitle}
      />

      <NotebookView
        currentNotebookState={currentNotebookState}
        pages={[currentNotebookState.pages[0], currentNotebookState.pages[1]]}
        scale={0.75}
      />
    </div>
  );
}
