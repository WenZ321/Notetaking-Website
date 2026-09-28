"use client";

import type { Editor } from "@tiptap/core";
import type { NotebookState } from "@/types/notebook";
import type { TextFormatState } from "@/types/textFormatting";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { EditingPageHeader } from "./EditingPageHeader";
import { TextFormattingToolbar } from "../TextFormattingToolbar/TextFormattingToolbar";
import { CustomTipTapNodesSideBar } from "./CustomTipTapNodesSideBar";
import { getNotebook, ensurePagesExist } from "@/data/notebookDB";
import { PageFlipButton } from "../PageFlipButton";
import { PageEditor } from "./PageEditor";
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
  // Pages switch by updating the URL without a route navigation, since Next.js remounts
  // the whole route whenever the pageId in the path changes. The URL stays the source of truth
  const pathname = usePathname();
  const activePageId = pathname.split("/").at(-1) ?? pageId;
  const [isCreatingPage, setIsCreatingPage] = useState(false);

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
    notebookState?.pages.findIndex((page) => page.id === activePageId) ?? -1;
  const currentPage = notebookState?.pages[currentPageIndex];

  if (!notebookState || !currentPage) {
    return <div>Loading...</div>;
  }

  // Only the page editor swaps, the URL still updates so refresh and the back link stay correct
  const goToPage = (targetPageId: string) => {
    window.history.pushState(
      null,
      "",
      `/userNotebooks/${notebookId}/${targetPageId}`,
    );
  };

  // Page 1 has only the cover before it, which isn't editable
  const previousPage = notebookState.pages[currentPageIndex - 1];
  const hasPreviousPage =
    previousPage !== undefined && previousPage.type !== "cover";

  const handlePreviousPage = () => {
    if (hasPreviousPage) goToPage(previousPage.id);
  };

  // Creates the next page first when this is the last one, storing the updated notebook
  // so this page knows about the new page before switching to it
  const handleNextPage = async () => {
    setIsCreatingPage(true);

    const nextPageIndex = currentPageIndex + 1;
    const updatedNotebook = await ensurePagesExist(notebookId, nextPageIndex);
    setNotebookState(updatedNotebook);
    goToPage(updatedNotebook.pages[nextPageIndex].id);

    setIsCreatingPage(false);
  };

  return (
    <div className="editing-page">
      <EditingPageHeader
        notebookId={notebookId}
        notebookTitle={notebookState.title}
        currentPageIndex={currentPageIndex}
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
            disabled={!hasPreviousPage || isCreatingPage}
            onClick={handlePreviousPage}
          />

          <PageEditor
            key={activePageId}
            notebookId={notebookId}
            pageId={activePageId}
            template={notebookState.template}
            currentTextFormatState={currentTextFormatting}
            updateTextFormatState={setCurrentTextFormatting}
            onEditorReady={setEditor}
          />

          <PageFlipButton
            direction="next"
            label="Next page"
            disabled={isCreatingPage}
            onClick={handleNextPage}
          />
        </section>

        <CustomTipTapNodesSideBar editor={editor} />
      </div>
    </div>
  );
}
