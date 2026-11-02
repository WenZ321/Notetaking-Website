"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import type { NotebookPaperType } from "@/types/Notebook";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import { useCallback, useState } from "react";
import { TipTapTextEditor } from "./TipTapTextEditor";
import { usePageAutosave } from "./UsePageAutosave";

type PageEditorProps = {
  notebookId: string;
  pageId: string;
  content: JSONContent;
  paperType: NotebookPaperType;
  updateTextFormatState: (newState: ToolbarFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * One page's editor and its autosave. Keyed by page where it's used,
 * so switching pages swaps only this part and leaves the rest of the editing page in place.
 * It starts from the editing page's copy of the page, which gets what was
 * written on each page as it's left, so its writing shows from the first frame
 */
export function PageEditor({
  notebookId,
  pageId,
  content,
  paperType,
  updateTextFormatState,
  onEditorReady,
}: PageEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  usePageAutosave(editor, notebookId, pageId);

  // Keeps the editor for autosave and also hands it up for the toolbar and sidebar
  const handleEditorReady = useCallback(
    (readyEditor: Editor) => {
      setEditor(readyEditor);
      onEditorReady(readyEditor);
    },
    [onEditorReady],
  );

  return (
    <TipTapTextEditor
      content={content}
      paperType={paperType}
      updateTextFormatState={updateTextFormatState}
      onEditorReady={handleEditorReady}
    />
  );
}
