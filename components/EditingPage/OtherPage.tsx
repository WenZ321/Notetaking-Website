"use client";

import type { NotebookPageState, NotebookPaperType } from "@/types/Notebook";
import { useEffect, useState } from "react";
import { getNotebookPage } from "@/data/NotebookDB";
import { NotebookSheet } from "../NotebookPage/NotebookSheet";

type OtherPageProps = {
  notebookId: string;
  pageId: string | undefined;
  paperType: NotebookPaperType;
};

/**
 * The page beside the one being edited, read-only like in the notebook view.
 * A page that doesn't exist yet shows as blank paper. Keyed by page where
 * it's used, so it never shows another page's content
 */
export function OtherPage({ notebookId, pageId, paperType }: OtherPageProps) {
  const [page, setPage] = useState<NotebookPageState | undefined>();

  // Loads from the database rather than the editing page's copy, which misses autosaved edits
  useEffect(() => {
    if (!pageId) return;
    getNotebookPage(notebookId, pageId)
      .then(setPage)
      .catch((error) => console.error("Failed to load page", error));
  }, [notebookId, pageId]);

  // Moving over to edit this page comes later, so clicking it does nothing yet
  return <NotebookSheet page={page} paperType={paperType} onOpen={() => {}} />;
}
