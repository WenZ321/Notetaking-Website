"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import type { NotebookTemplate } from "@/types/notebook";
import type { TextFormatState } from "@/types/textFormatting";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { useCallback, useEffect, useState } from "react";
import { getNotebookPage } from "@/data/notebookDB";
import { TiptapTextEditor } from "./TiptapTextEditor";
import { usePageAutosave } from "./usePageAutosave";

type PageEditorProps = {
  notebookId: string;
  pageId: string;
  template: NotebookTemplate;
  currentTextFormatState: TextFormatState;
  updateTextFormatState: (newState: TextFormatState) => void;
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
  currentTextFormatState,
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

    loadPage();
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
        <div
          className="editing-page-tiptap-text-editor"
          style={
            {
              "--editor-width": `${NOTEBOOK_PAGE_WIDTH}px`,
              "--editor-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
            } as React.CSSProperties
          }
        />
      </div>
    );
  }

  return (
    <TiptapTextEditor
      currentTextFormatState={currentTextFormatState}
      content={content}
      template={template}
      updateTextFormatState={updateTextFormatState}
      onEditorReady={handleEditorReady}
    />
  );
}
