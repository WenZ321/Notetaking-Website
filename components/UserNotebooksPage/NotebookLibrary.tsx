"use client";

import type { NotebookState } from "@/types/Notebook";
import { useEffect, useState } from "react";
import { NotebookPreview } from "./NotebookPreview";
import { getNotebooks } from "@/data/NotebookDB";
import "./NotebookLibrary.css";

/**
 * The section of the notebooks page that displays the user's saved notebooks.
 */
export function NotebookLibrary() {
  const [notebooks, setNotebooks] = useState<NotebookState[]>([]);

  // Loads all of the saved notebooks from IndexedDB
  useEffect(() => {
    async function loadNotebooks() {
      const savedNotebooks = await getNotebooks();
      setNotebooks(savedNotebooks);
    }

    loadNotebooks().catch((error) =>
      console.error("Failed to load notebooks", error),
    );
  }, []);

  return (
    <section className="user-notebooks-page-notebook-library-section">
      <div className="user-notebooks-page-notebook-library-shelf">
        <div className="user-notebooks-page-notebook-library-row">
          {notebooks.map((notebook) => (
            <NotebookPreview
              key={notebook.id}
              title={notebook.title}
              id={notebook.id}
              coverStyle={notebook.coverStyle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
