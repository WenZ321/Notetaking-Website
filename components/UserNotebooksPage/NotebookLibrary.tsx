"use client";

import type { NotebookSummary } from "@/types/Notebook";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getNotebooks } from "@/data/NotebookDB";
import "./NotebookLibrary.css";

// Loaded only in the browser and in its own file, since 3D can't be drawn
// on the server and three.js is a big download
const BookshelfScene = dynamic(
  () =>
    import("@/components/3DScene/Bookshelf/BookshelfScene").then(
      (module) => module.BookshelfScene,
    ),
  { ssr: false },
);

/**
 * The section of the notebooks page that displays the user's saved notebooks.
 */
export function NotebookLibrary() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);

  // The notebook whose link has keyboard focus, which pulls it out of the shelf
  const [focusedNotebookId, setFocusedNotebookId] = useState<string | null>(
    null,
  );

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
      <BookshelfScene
        notebooks={notebooks}
        focusedNotebookId={focusedNotebookId}
        onOpenNotebook={(notebookId) =>
          router.push(`/userNotebooks/${notebookId}`)
        }
      />

      {/* the 3D notebooks are what's seen and clicked, these links are for
          the keyboard and screen readers, in the same order as the shelf */}
      {notebooks.map((notebook) => (
        <Link
          key={notebook.id}
          href={`/userNotebooks/${notebook.id}`}
          className="visually-hidden"
          onFocus={() => setFocusedNotebookId(notebook.id)}
          onBlur={() =>
            setFocusedNotebookId((current) =>
              current === notebook.id ? null : current,
            )
          }
        >
          {notebook.title}
        </Link>
      ))}
    </section>
  );
}
