"use client";

import { useEffect, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import type { NotebookState } from "@/types/notebook";
import EditingPageHeader from "./EditingPageHeader";
import TextFormattingToolbar from "../TextFormattingToolbar/TextFormattingToolbar";
import TiptapTextEditor from "./TiptapTextEditor";
import { updateNotebookPage, getNotebook } from "@/data/notebookDB";

type EditingPageClientProps = {
  notebookId: string;
  pageId: string;
};

export default function EditingPageClient({
  notebookId,
  pageId,
}: EditingPageClientProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notebookState, setNotebookState] = useState<NotebookState | null>(
    null,
  );

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
  }, [notebookId, pageId]);

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
      <TextFormattingToolbar editor={editor} />
      <TiptapTextEditor
        onEditorReady={setEditor}
        content={currentPage.content || null}
      />
    </div>
  );
}
