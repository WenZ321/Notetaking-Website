"use client";

import type { Editor } from "@tiptap/core";
import type { NotebookPageState, NotebookState } from "@/types/Notebook";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import {
  DefaultTextFormatState,
  DEFAULT_TEXT_FORMAT_VARIABLES,
} from "@/constants/TextFormattingConstants";
import { updateEditorTextFormatting } from "@/tiptap/TipTapUtils";
import { NOTEBOOK_PAGE_VARIABLES } from "@/constants/NotebookPageConstants";
import { getLeftPageIndex } from "../NotebookPage/NotebookPageUrl";
import { Notebook } from "../NotebookPage/Notebook";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { EditingPageHeader } from "./EditingPageHeader";
import { TextFormattingToolbar } from "../TextFormattingToolbar/TextFormattingToolbar";
import { CustomTipTapNodesSideBar } from "./CustomTipTapNodesSideBar";
import { getNotebook, ensurePagesExist } from "@/data/NotebookDB";
import { PageFlipButton } from "../PageFlipButton";
import { PageEditor } from "./PageEditor";
import { NotebookSheet } from "../NotebookPage/NotebookSheet";
import { getSavableDoc } from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import {
  clearArrivingFromNotebookView,
  isArrivingFromNotebookView,
} from "./ArrivingFromNotebookView";
import "./EditingPageClient.css";

type EditingPageClientProps = {
  notebookId: string;
};

// The editing page for a notebook. The header, toolbar, sidebar and page arrows stay in place
// while the page editor inside swaps between pages
export function EditingPageClient({ notebookId }: EditingPageClientProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notebookState, setNotebookState] = useState<NotebookState | null>(
    null,
  );
  const [currentTextFormatting, setCurrentTextFormatting] =
    useState<ToolbarFormatState>(DefaultTextFormatState);
  // Why the notebook can't be shown, or null while it's fine
  const [loadProblem, setLoadProblem] = useState<string | null>(null);
  // The page the notebook last moved to. It's still moving there until the
  // address points at that page
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);

  // Coming from a page clicked in the notebook view, the tools slide in
  // after the zoom onto the page. Read once, so later visits start still
  const [isArriving] = useState(isArrivingFromNotebookView);
  useEffect(() => clearArrivingFromNotebookView(), []);

  // Pages switch by updating the URL without a route navigation, since Next.js remounts
  // the whole route whenever the pageId in the path changes. The URL stays the source of truth
  const pathname = usePathname();
  const activePageId = pathname.slice(pathname.lastIndexOf("/") + 1);

  useEffect(() => {
    async function loadNotebook() {
      const notebook = await getNotebook(notebookId);
      if (notebook) {
        setNotebookState(notebook);
      } else {
        setLoadProblem("Notebook not found");
      }
    }

    loadNotebook().catch((error) => {
      console.error("Failed to load notebook", error);
      setLoadProblem("Couldn't open this notebook");
    });
  }, [notebookId]);

  const currentPageIndex =
    notebookState?.pages.findIndex((page) => page.id === activePageId) ?? -1;

  if (loadProblem) {
    return <div>{loadProblem}</div>;
  }

  if (!notebookState) {
    return <div>Loading...</div>;
  }

  // The notebook loaded but has page ID doesn't exist
  if (currentPageIndex === -1) {
    return <div>Page not found</div>;
  }

  // Puts what was just written on the page being edited into the notebook's
  // copy, which draws it once it's read-only and starts its next editor
  const keepWrittenContent = () => {
    if (!editor || editor.isDestroyed) return;
    const content = getSavableDoc(editor.state).toJSON();
    setNotebookState(
      (notebook) =>
        notebook && {
          ...notebook,
          pages: notebook.pages.map((page) =>
            page.id === activePageId ? { ...page, content } : page,
          ),
        },
    );
  };

  // Replaces instead of pushing so switching pages doesn't fill up the browser history
  const goToPage = (targetPageId: string) => {
    keepWrittenContent();
    window.history.replaceState(
      null,
      "",
      `/userNotebooks/${notebookId}/${targetPageId}`,
    );
  };

  // The notebook lies open at this page's spread, with the page on its left
  // or right side as in the notebook view
  const leftPageIndex = getLeftPageIndex(currentPageIndex);
  const pageSide = leftPageIndex === currentPageIndex ? "left" : "right";
  // Moving to another page, the notebook slides under the tools so that page
  // lands where this one is, and editing moves there once it lands. A page
  // on another spread is turned to at the same time, while every page is
  // read-only, since the page being left turns over with it
  const moveTargetIndex = notebookState.pages.findIndex(
    (page) => page.id === moveTargetId,
  );
  const isMoving = moveTargetIndex !== -1 && moveTargetId !== activePageId;
  const moveTargetLeftIndex = getLeftPageIndex(moveTargetIndex);
  const moveTargetSide =
    moveTargetLeftIndex === moveTargetIndex ? "left" : "right";
  const isTurning = isMoving && moveTargetLeftIndex !== leftPageIndex;

  // With reduced motion a page on this spread is switched to at once, and a
  // page on another spread fades in where it lands instead of turning
  const moveTo = (targetPageId: string, targetIndex: number) => {
    const isOnThisSpread = getLeftPageIndex(targetIndex) === leftPageIndex;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isOnThisSpread && prefersReducedMotion) {
      // forgets the last move, which would otherwise look unfinished here
      setMoveTargetId(null);
      goToPage(targetPageId);
      return;
    }
    keepWrittenContent();
    setMoveTargetId(targetPageId);
  };

  // A move ends with the slide, or with the turn when there's one, which
  // lasts as long as the slide, or with reduced motion is just a fade
  const finishMove = () => {
    if (isMoving) goToPage(notebookState.pages[moveTargetIndex].id);
  };

  const handleSlideEnd = (event: React.TransitionEvent) => {
    if (!isTurning && event.target === event.currentTarget) finishMove();
  };

  // Only this page can be edited, the one beside it is read-only
  const renderPage = (page: NotebookPageState | undefined) =>
    page?.id === activePageId && !isTurning ? (
      <PageEditor
        key={activePageId}
        notebookId={notebookId}
        pageId={activePageId}
        content={page.content}
        paperType={notebookState.paperType}
        updateTextFormatState={setCurrentTextFormatting}
        onEditorReady={setEditor}
      />
    ) : (
      <NotebookSheet
        page={page}
        paperType={notebookState.paperType}
        onOpen={() => {}}
      />
    );

  // Page 1 has only the cover before it, which isn't editable
  const previousPageIndex = currentPageIndex - 1;
  const hasPreviousPage = previousPageIndex > COVER_PAGE_INDEX;

  const handlePreviousPage = () => {
    if (!hasPreviousPage || isMoving) return;
    moveTo(notebookState.pages[previousPageIndex].id, previousPageIndex);
  };

  // A toolbar change shows in the toolbar and applies to the selection right
  // away. Only the toolbar writes to the editor, so reading the selection
  // into the toolbar can never write stale values back
  const handleTextFormatChange = (newState: ToolbarFormatState) => {
    setCurrentTextFormatting(newState);
    if (editor) updateEditorTextFormatting(editor, newState);
  };

  // Creates the next page first when this is the last one before moving to
  // it. From a right page that's a new spread, so both its pages are made
  const handleNextPage = async () => {
    if (isMoving) return;
    const nextPageIndex = currentPageIndex + 1;
    const lastNeededIndex =
      pageSide === "right" ? nextPageIndex + 1 : nextPageIndex;
    const updatedNotebook = await ensurePagesExist(notebookId, lastNeededIndex);

    // Stored so this page knows about a newly created page before moving to it
    setNotebookState(updatedNotebook);
    moveTo(updatedNotebook.pages[nextPageIndex].id, nextPageIndex);
  };

  return (
    <div
      className="editing-page"
      data-arriving={isArriving}
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          ...DEFAULT_TEXT_FORMAT_VARIABLES,
          "--notebook-scale": 1,
        } as React.CSSProperties
      }
    >
      <EditingPageHeader
        notebookId={notebookId}
        notebookTitle={notebookState.title}
        currentPageIndex={currentPageIndex}
      />
      <TextFormattingToolbar
        textFormatState={currentTextFormatting}
        updateTextFormatState={handleTextFormatChange}
      />
      <div className="editing-page-workspace">
        <section className="editing-page-page-section">
          <PageFlipButton
            direction="previous"
            label="Previous page"
            disabled={!hasPreviousPage}
            onClick={handlePreviousPage}
          />

          {/* It's settled on this page's spread, and turns to the target's
              while moving there */}
          <div
            className="editing-page-notebook"
            data-side={pageSide}
            data-slide-to={isMoving ? moveTargetSide : undefined}
            onTransitionEnd={handleSlideEnd}
          >
            <Notebook
              notebook={notebookState}
              leftPageIndex={isTurning ? moveTargetLeftIndex : leftPageIndex}
              settledPageIndex={leftPageIndex}
              renderPage={renderPage}
              onTurnEnd={finishMove}
            />
          </div>

          <PageFlipButton
            direction="next"
            label="Next page"
            onClick={handleNextPage}
          />
        </section>

        <CustomTipTapNodesSideBar
          editor={editor}
          paperType={notebookState.paperType}
          textFormatState={currentTextFormatting}
        />
      </div>
    </div>
  );
}
