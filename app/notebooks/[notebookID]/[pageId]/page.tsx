"use client";

import { use, useEffect, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { getNotebookPage } from "@/data/notebookDB";
import TextFormattingToolbar from "@/components/TextFormattingToolbar/TextFormattingToolbar";
import TiptapTextEditor from "@/components/EditingPage/TiptapTextEditor";
import EditingPageHeader from "@/components/EditingPage/EditingPageHeader";

type EditingPageProps = {
  params: Promise<{
    notebookId: string;
    pageId: string;
  }>;
};

export default function EditingPage({ params }: EditingPageProps) {
  const { notebookId, pageId } = use(params);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [pageContent, setPageContent] = useState<JSONContent | null>(null);

  useEffect(() => {
    async function loadPage() {
      const page = await getNotebookPage(notebookId, pageId);
      setPageContent(page.content);
    }

    loadPage();
  }, [notebookId, pageId]);

  if (!pageContent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editing-page">
      <EditingPageHeader notebookId={notebookId} />
      <TextFormattingToolbar editor={editor} />
      <TiptapTextEditor onEditorReady={setEditor} content={pageContent} />
    </div>
  );
}
