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
import { useRouter } from "next/navigation";
import { getNotebook, addNotebookPage } from "@/data/notebookDB";
import { createEmptyNotebookPage } from "../NotebookPage/createEmptyNotebookPage";
import { PageFlipButton } from "../PageFlipButton/PageFlipButton";
import { usePageAutosave } from "./usePageAutosave";
import "./EditingPageClient.css";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

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

  const currentPageIndex =
    notebookState?.pages.findIndex((page) => page.id === pageId) ?? -1;
  const currentPage = notebookState?.pages[currentPageIndex];

  if (!notebookState || !currentPage) {
    return <div>Loading...</div>;
  }

  const goToPage = (targetPageId: string) => {
    setIsNavigating(true);
    router.push(`/userNotebooks/${notebookId}/${targetPageId}`);
  };

  const handlePreviousPage = () => {
    const previousPage = notebookState.pages[currentPageIndex - 1];
    if (previousPage) goToPage(previousPage.id);
  };

  // Creates the next page first when this is the last one
  const handleNextPage = async () => {
    const nextPage = notebookState.pages[currentPageIndex + 1];
    if (nextPage) {
      goToPage(nextPage.id);
      return;
    }

    setIsNavigating(true);
    const newPage = createEmptyNotebookPage(notebookState.pages.length + 1);
    await addNotebookPage(notebookId, newPage);
    goToPage(newPage.id);
  };

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
          <PageFlipButton
            direction="previous"
            label="Previous page"
            disabled={currentPageIndex === 0 || isNavigating}
            onClick={handlePreviousPage}
          />

          <TiptapTextEditor
            currentTextFormatState={currentTextFormatting}
            content={currentPage.content || null}
            template={notebookState.template}
            updateTextFormatState={setCurrentTextFormatting}
            onEditorReady={setEditor}
          />

          <PageFlipButton
            direction="next"
            label="Next page"
            disabled={isNavigating}
            onClick={handleNextPage}
          />
        </section>

        <CustomTipTapNodesSideBar editor={editor} />
      </div>
    </div>
  );
}
