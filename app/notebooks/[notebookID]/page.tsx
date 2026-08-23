"use client";

import type { Editor } from "@tiptap/react";
import { use, useEffect, useState } from "react";
import MenuBar from "@/components/MenuBar";
import NotebookView from "@/components/NotebookView";
import { updateNotebookTitle, getNotebook } from "@/data/notebookDB";
import type { notebook } from "@/types/notebook";

type NotebookPageProps = {
  params: Promise<{ notebookID: string }>;
};

export default function NotebookPage({ params }: NotebookPageProps) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [currentNotebook, setCurrentNotebook] = useState<notebook | null>(null);

  const { notebookID } = use(params);

  useEffect(() => {
    async function loadNotebook() {
      const savedNotebook = await getNotebook(notebookID);

      if (savedNotebook) {
        setCurrentNotebook(savedNotebook);
      }
    }

    loadNotebook();
  }, [notebookID]);

  if (!currentNotebook) {
    return <div>Loading...</div>;
  }

  return (
    <div className="notebook-page">
      <MenuBar
        notebookID={notebookID}
        currentTitle={currentNotebook.title}
        updateNotebookTitle={updateNotebookTitle}
      />

      <NotebookView onActivate={setActiveEditor} />
    </div>
  );
}
