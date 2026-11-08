import type { Editor } from "@tiptap/core";
import { useEffect } from "react";
import type { Transaction } from "@tiptap/pm/state";
import { updateNotebookPage } from "@/data/NotebookDB";
import {
  LIVE_DROP_PREVIEW_META,
  getSavableDoc,
} from "@/tiptap/extensions/BlockDragAndDrop/DragState";

export const AUTOSAVE_DELAY_MS = 500;

/**
 * Saves the page shortly after edits stop, and right away when the page is
 * hidden or stops being watched
 * @param editor The page's editor
 * @param notebookId The notebook the page is in
 * @param pageId The page
 * @returns Stops watching, saving anything not saved yet
 */
export function watchPageSaves(
  editor: Editor,
  notebookId: string,
  pageId: string,
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let hasUnsavedChanges = false;

  const saveNow = () => {
    clearTimeout(timeoutId);
    if (!hasUnsavedChanges || editor.isDestroyed) return;

    // a drop shown while dragging isn't saved, only the page under it
    hasUnsavedChanges = false;
    const doc = getSavableDoc(editor.state).toJSON();
    updateNotebookPage(notebookId, pageId, doc).catch((error) => {
      // still unsaved, so the next edit or hiding the page tries again
      hasUnsavedChanges = true;
      console.error("Autosave failed", error);
    });
  };

  const handleUpdate = ({ transaction }: { transaction: Transaction }) => {
    if (transaction.getMeta(LIVE_DROP_PREVIEW_META)) return;

    hasUnsavedChanges = true;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(saveNow, AUTOSAVE_DELAY_MS);
  };

  // Closing or switching tabs hides the page first, catching exits that never unmount
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") saveNow();
  };

  editor.on("update", handleUpdate);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    editor.off("update", handleUpdate);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    saveNow();
  };
}

// Saves the page while its editor is open
export function usePageAutosave(
  editor: Editor | null,
  notebookId: string,
  pageId: string,
) {
  useEffect(() => {
    if (!editor) return;
    return watchPageSaves(editor, notebookId, pageId);
  }, [editor, notebookId, pageId]);
}
