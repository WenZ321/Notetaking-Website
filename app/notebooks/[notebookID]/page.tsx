"use client";
import type { Editor } from "@tiptap/react";
import { use, useEffect, useState } from "react";
import NotebookMenuBar from "@/components/NotebookMenuBar";
import NotebookView from "@/components/NotebookView";
import { updateNotebookTitle, getNotebook } from "@/data/notebookDB";
import type { NotebookState } from "@/types/notebook";

type NotebookPageProps = {
  params: Promise<{ notebookID: string }>;
};

/**
 * The main page for a specific notebook, identified by its notebookID.
 */

export default function NotebookPage({ params }: NotebookPageProps) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [currentNotebookState, setCurrentNotebookState] =
    useState<NotebookState | null>(null);

  // Gets the notebook ID from web link
  const { notebookID } = use(params);

  // Loads the notebook data from the database with the notebookID
  useEffect(() => {
    async function loadNotebook() {
      const savedNotebook = await getNotebook(notebookID);

      if (savedNotebook) {
        setCurrentNotebookState(savedNotebook);
      }
    }

    loadNotebook();
  }, [notebookID]);

  // A loading state while the notebook data is being fetched from the database
  if (!currentNotebookState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="notebook-page">
      <NotebookMenuBar
        notebookID={notebookID}
        currentTitle={currentNotebookState.title}
        updateNotebookTitle={updateNotebookTitle}
      />

      <NotebookView onActivate={setActiveEditor} />
    </div>
  );
}
