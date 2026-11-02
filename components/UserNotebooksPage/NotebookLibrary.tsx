"use client";

import type { NotebookSummary } from "@/types/Notebook";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getNotebooks } from "@/data/NotebookDB";
import { useCreatingNotebook } from "./CreatingNotebook";
import "./NotebookLibrary.css";

// Loaded only in the browser and in its own file, since 3D can't be drawn
// on the server and three.js is a big download
const BookshelfScene = dynamic(
  () =>
    import("@/components/3DScene/Bookshelf/BookshelfScene/BookshelfScene").then(
      (module) => module.BookshelfScene,
    ),
  { ssr: false },
);

/**
 * The section of the notebooks page that displays the user's saved notebooks.
 */
export function NotebookLibrary() {
  const router = useRouter();
  const { creating } = useCreatingNotebook();
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);

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
        creating={creating}
        onOpenNotebook={(notebookId) =>
          router.push(`/userNotebooks/${notebookId}`)
        }
      />
    </section>
  );
}
