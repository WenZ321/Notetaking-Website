"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import type { NotebookTemplate } from "@/types/Notebook";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import { useCallback, useEffect, useState } from "react";
import { getNotebookPage } from "@/data/NotebookDB";
import { TiptapTextEditor } from "./TiptapTextEditor";
import { usePageAutosave } from "./UsePageAutosave";

type PageEditorProps = {
  notebookId: string;
  pageId: string;
  template: NotebookTemplate;
  updateTextFormatState: (newState: ToolbarFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * One page's editor and its autosave. Keyed by page where it's used,
 * so switching pages swaps only this part and leaves the rest of the editing page in place.
 */
export function PageEditor({
  notebookId,
  pageId,
  template,
  updateTextFormatState,
  onEditorReady,
}: PageEditorProps) {
  const [content, setContent] = useState<JSONContent | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  usePageAutosave(editor, notebookId, pageId);

  // Loads from the database rather than the editing page's copy, which misses autosaved edits
  useEffect(() => {
    async function loadPage() {
      const page = await getNotebookPage(notebookId, pageId);
      setContent(page.content);
    }

    loadPage().catch((error) => console.error("Failed to load page", error));
  }, [notebookId, pageId]);

  // Keeps the editor for autosave and also hands it up for the toolbar and sidebar
  const handleEditorReady = useCallback(
    (readyEditor: Editor) => {
      setEditor(readyEditor);
      onEditorReady(readyEditor);
    },
    [onEditorReady],
  );

  // Same size as the page, so nothing around it shifts while the content loads
  if (!content) {
    return (
      <div className="editing-page-tiptap-text-editor-container">
        <div className="editing-page-tiptap-text-editor" />
      </div>
    );
  }

  return (
    <TiptapTextEditor
      content={content}
      template={template}
      updateTextFormatState={updateTextFormatState}
      onEditorReady={handleEditorReady}
    />
  );
}
