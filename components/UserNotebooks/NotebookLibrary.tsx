"use client";

import { useEffect, useState } from "react";
import { getNotebooks } from "@/data/notebookDB";
import type { NotebookState } from "@/types/notebook";
import NotebookPreview from "./NotebookPreview";
import "./NotebookLibrary.css";

/**
 * The section of the notebooks page that displays the user's saved notebooks.
 */
export default function NotebookLibrary() {
  const [notebooks, setNotebooks] = useState<NotebookState[]>([]);

  // Loads all of the saved notebooks from IndexedDB
  useEffect(() => {
    async function loadNotebooks() {
      const savedNotebooks = await getNotebooks();
      setNotebooks(savedNotebooks);
    }

    loadNotebooks();
  }, []);

  return (
    <section className="user-notebooks-section">
      <div className="user-notebooks-containter">
        {notebooks.map((notebook) => (
          <NotebookPreview
            key={notebook.id}
            title={notebook.title}
            id={notebook.id}
          />
        ))}
      </div>
    </section>
  );
}
