import type { Editor } from "@tiptap/core";
import { useEffect } from "react";
import type { Transaction } from "@tiptap/pm/state";
import { updateNotebookPage } from "@/data/notebookDB";
import { LIVE_DROP_PREVIEW_META } from "@/tiptap/extensions/BlockDragAndDrop/dragState";
import { getSavableDoc } from "@/tiptap/extensions/BlockDragAndDrop/LivePreview/getSavableDoc";

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

      // a drop shown while dragging isn't saved, only the page under it
      hasUnsavedChanges = false;
      const doc = getSavableDoc(editor.state).toJSON();
      updateNotebookPage(notebookId, pageId, doc).catch((error) =>
        console.error("Autosave failed", error),
      );
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
  }, [editor, notebookId, pageId]);
}
