"use client";

import type { Editor, JSONContent } from "@tiptap/core";
import type { NotebookState } from "@/types/notebook";
import type { TextFormatState } from "@/types/textFormatting";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { useEffect, useState } from "react";
import { EditingPageHeader } from "./EditingPageHeader";
import { TextFormattingToolbar } from "../TextFormattingToolbar/TextFormattingToolbar";
import { TiptapTextEditor } from "./TiptapTextEditor";
import { CustomTipTapNodesSideBar } from "./CustomTipTapNodesSideBar";
import { updateNotebookPage, getNotebook } from "@/data/notebookDB";

type EditingPageClientProps = {
  notebookId: string;
  pageId: string;
};

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

  const savePageContent = async (content: JSONContent) => {
    await updateNotebookPage(notebookId, pageId, content);
  };

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
        saveNotebookPageContent={async () => {
          if (!editor) return;

          await savePageContent(editor.getJSON());
        }}
      />
      <TextFormattingToolbar
        textFormatState={currentTextFormatting}
        updateTextFormatState={setCurrentTextFormatting}
      />
      <div>
        <TiptapTextEditor
          currentTextFormatState={currentTextFormatting}
          content={currentPage.content || null}
          updateTextFormatState={setCurrentTextFormatting}
          onEditorReady={setEditor}
        />

        <CustomTipTapNodesSideBar editor={editor} />
      </div>
    </div>
  );
}
