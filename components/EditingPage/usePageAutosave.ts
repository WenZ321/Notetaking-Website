import type { Editor } from "@tiptap/core";
import { useEffect } from "react";
import { updateNotebookPage } from "@/data/notebookDB";

const AUTOSAVE_DELAY_MS = 500;

// Saves the page shortly after edits stop, and right away when the page is left or hidden
export function usePageAutosave(
  editor: Editor | null,
  notebookId: string,
  pageId: string,
) {
  useEffect(() => {
    if (!editor) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let hasUnsavedChanges = false;

    const saveNow = () => {
      clearTimeout(timeoutId);
      if (!hasUnsavedChanges || editor.isDestroyed) return;

      hasUnsavedChanges = false;
      updateNotebookPage(notebookId, pageId, editor.getJSON()).catch((error) =>
        console.error("Autosave failed", error),
      );
    };

    const handleUpdate = () => {
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
  }, [editor, notebookId, pageId]);
}
