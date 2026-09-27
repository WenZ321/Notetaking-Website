"use client";

import type { Editor } from "@tiptap/core";
import type { NotebookState } from "@/types/notebook";
import type { TextFormatState } from "@/types/textFormatting";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { useEffect, useState } from "react";
import { EditingPageHeader } from "./EditingPageHeader";
import { TextFormattingToolbar } from "../TextFormattingToolbar/TextFormattingToolbar";
import { TiptapTextEditor } from "./TiptapTextEditor";
import { CustomTipTapNodesSideBar } from "./CustomTipTapNodesSideBar";
import { getNotebook } from "@/data/notebookDB";
import { usePageAutosave } from "./usePageAutosave";
import "./EditingPage.css";

type EditingPageClientProps = {
  notebookId: string;
  pageId: string;
};

// Loads one notebook page and wires together the editor, toolbar, and header for it, autosaving edits.
export function EditingPageClient({
  notebookId,
  pageId,
}: EditingPageClientProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notebookState, setNotebookState] = useState<NotebookState | null>(
    null,
  );
  const [currentTextFormatting, setCurrentTextFormatting] =
    useState<TextFormatState>(DefaultTextFormatState);

  usePageAutosave(editor, notebookId, pageId);

  useEffect(() => {
    async function loadNotebook() {
      const notebook = await getNotebook(notebookId);
      if (notebook) {
        setNotebookState(notebook);
      }
    }

    loadNotebook();
  }, [notebookId]);

  const currentPage = notebookState?.pages.find((page) => page.id === pageId);

  if (!notebookState || !currentPage) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editing-page">
      <EditingPageHeader
        notebookId={notebookId}
        notebookTitle={notebookState.title}
      />
      <TextFormattingToolbar
        textFormatState={currentTextFormatting}
        updateTextFormatState={setCurrentTextFormatting}
      />
      <div className="editing-page-workspace">
        <section className="editing-page-page-section">
          <TiptapTextEditor
            currentTextFormatState={currentTextFormatting}
            content={currentPage.content || null}
            template={notebookState.template}
            updateTextFormatState={setCurrentTextFormatting}
            onEditorReady={setEditor}
          />
        </section>

        <CustomTipTapNodesSideBar editor={editor} />
      </div>
    </div>
  );
}
