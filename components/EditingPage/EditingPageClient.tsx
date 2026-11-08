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
import {
  getRightPageIndex,
  getNotebookPageHref,
} from "../NotebookPage/NotebookPageUrl";
import { Notebook } from "../NotebookPage/Notebook";
import { markReturningFromEditor } from "../NotebookPage/ReturningFromEditor";
import { NOTEBOOK_ZOOM_TRANSITION } from "../NotebookPage/NotebookZoomTransition";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EditingPageHeader } from "./EditingPageHeader";
import { NotebookBackButton } from "./NotebookBackButton";
import { TextFormattingToolbar } from "../TextFormattingToolbar/TextFormattingToolbar";
import { CustomTipTapNodesSideBar } from "./CustomTipTapNodesSideBar";
import {
  readInsertPanelHidden,
  saveInsertPanelHidden,
} from "./InsertPanelHidden";
import { getNotebook, ensurePagesExist } from "@/data/NotebookDB";
import { PageFlipButton } from "../PageFlipButton";
import { PageEditor } from "./PageEditor";
import { NotebookSheet } from "../NotebookPage/NotebookSheet";
import { getSavableDoc } from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import {
  clearArrivingFromNotebookView,
  getArrivingFromNotebookView,
} from "./ArrivingFromNotebookView";
import "./EditingPageClient.css";

type EditingPageClientProps = {
  notebookId: string;
};

// Where the page being edited is across the window
function getPageX(pageSection: HTMLElement) {
  const page = pageSection.querySelector(".editing-page-notebook");
  return page ? page.getBoundingClientRect().x : 0;
}

// The editing page for a notebook. The header, toolbar, sidebar and page arrows stay in place
// while the page editor inside swaps between pages
export function EditingPageClient({ notebookId }: EditingPageClientProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  // Coming from a page clicked in the notebook view, it already has the
  // notebook, so it's shown from the first frame, and the tools slide in
  // after the zoom onto the page. Read once, so later visits start still
  const [arrivingNotebook] = useState(getArrivingFromNotebookView);
  useEffect(() => clearArrivingFromNotebookView(), []);
  const isArriving = arrivingNotebook?.id === notebookId;

  const [notebookState, setNotebookState] = useState<NotebookState | null>(
    isArriving ? arrivingNotebook : null,
  );
  const [currentTextFormatting, setCurrentTextFormatting] =
    useState<ToolbarFormatState>(DefaultTextFormatState);
  // Why the notebook can't be shown, or null while it's fine
  const [loadProblem, setLoadProblem] = useState<string | null>(null);
  // The page the notebook last moved to. It's still moving there until the
  // address points at that page
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  // Leaving for the notebook view, while the tools move out of the way
  const [isLeaving, setIsLeaving] = useState(false);

  // With the insert panel hidden, the page is centered in the whole window
  // instead of the space left of the panel. When that changes it slides to
  // its new spot along with the panel, from where it was before
  const [isPanelHidden, setIsPanelHidden] = useState(readInsertPanelHidden);
  const pageSectionRef = useRef<HTMLElement>(null);
  const pageXBeforeToggle = useRef<number | null>(null);

  useLayoutEffect(() => {
    const section = pageSectionRef.current;
    const pageXBefore = pageXBeforeToggle.current;
    pageXBeforeToggle.current = null;
    if (!section || pageXBefore === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pageX = getPageX(section);
    // as long as the panel's slide, --tools-slide-duration
    section.animate(
      [{ translate: `${pageXBefore - pageX}px 0` }, { translate: "0 0" }],
      { duration: 250, easing: "ease-out" },
    );
  }, [isPanelHidden]);

  const handleTogglePanel = () => {
    if (pageSectionRef.current) {
      pageXBeforeToggle.current = getPageX(pageSectionRef.current);
    }
    setIsPanelHidden(!isPanelHidden);
    saveInsertPanelHidden(!isPanelHidden);
  };
  const router = useRouter();

  // Pages switch by updating the URL without a route navigation, since Next.js remounts
  // the whole route whenever the pageId in the path changes. The URL stays the source of truth
  const pathname = usePathname();
  const activePageId = pathname.slice(pathname.lastIndexOf("/") + 1);

  useEffect(() => {
    if (isArriving) return;

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
  }, [notebookId, isArriving]);

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

  // The notebook with what was just written on the page being edited
  const withWrittenContent = (notebook: NotebookState): NotebookState => {
    if (!editor || editor.isDestroyed) return notebook;
    const content = getSavableDoc(editor.state).toJSON();
    return {
      ...notebook,
      pages: notebook.pages.map((page) =>
        page.id === activePageId ? { ...page, content } : page,
      ),
    };
  };

  // Puts it into the notebook's copy, which draws the page once it's
  // read-only and starts its next editor
  const keepWrittenContent = () => {
    setNotebookState((notebook) => notebook && withWrittenContent(notebook));
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
  const rightPageIndex = getRightPageIndex(currentPageIndex);
  const pageSide = rightPageIndex === currentPageIndex ? "right" : "left";
  // Moving to another page, the notebook slides under the tools so that page
  // lands where this one is, and editing moves there once it lands. A page
  // on another spread is turned to at the same time, while every page is
  // read-only, since the page being left turns over with it
  const moveTargetIndex = notebookState.pages.findIndex(
    (page) => page.id === moveTargetId,
  );
  const isMoving = moveTargetIndex !== -1 && moveTargetId !== activePageId;
  const moveTargetRightIndex = getRightPageIndex(moveTargetIndex);
  const moveTargetSide =
    moveTargetRightIndex === moveTargetIndex ? "right" : "left";
  const isTurning = isMoving && moveTargetRightIndex !== rightPageIndex;

  // With reduced motion a page on this spread is switched to at once, and a
  // page on another spread fades in where it lands instead of turning
  const moveTo = (targetPageId: string, targetIndex: number) => {
    const isOnThisSpread = getRightPageIndex(targetIndex) === rightPageIndex;
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

  // Back to the notebook opened at this page's spread. The tools slide back
  // out to their edges first, waiting for a move between pages to land.
  // With reduced motion it goes straight away
  const notebookHref = getNotebookPageHref(notebookId, rightPageIndex);

  const handleLeave = () => {
    if (isMoving || isLeaving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(notebookHref);
      return;
    }
    setIsLeaving(true);
  };

  // The notebook view starts zoomed onto this page right where it is now,
  // scrolled or not, and pulls back out from there
  const handleToolsOut = (event: React.AnimationEvent) => {
    if (event.animationName !== "editing-page-tools-to-top") return;
    const paper = document.querySelector(".editing-page-tiptap-text-editor");
    if (paper) {
      markReturningFromEditor({
        notebook: withWrittenContent(notebookState),
        pageId: activePageId,
        paperRect: paper.getBoundingClientRect(),
      });
    }
    router.push(notebookHref, { transitionTypes: [NOTEBOOK_ZOOM_TRANSITION] });
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
    // the pages couldn't be made, so it stays on this page
    const updatedNotebook = await ensurePagesExist(
      notebookId,
      lastNeededIndex,
    ).catch((error) => {
      console.error("Couldn't add pages", error);
      return null;
    });
    if (!updatedNotebook) return;

    // Stored so this page knows about a newly created page before moving to it
    setNotebookState(updatedNotebook);
    moveTo(updatedNotebook.pages[nextPageIndex].id, nextPageIndex);
  };

  return (
    <div
      className="editing-page"
      data-arriving={isArriving}
      data-leaving={isLeaving}
      onAnimationEnd={handleToolsOut}
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          ...DEFAULT_TEXT_FORMAT_VARIABLES,
        } as React.CSSProperties
      }
    >
      <EditingPageHeader notebookTitle={notebookState.title} />
      <TextFormattingToolbar
        textFormatState={currentTextFormatting}
        updateTextFormatState={handleTextFormatChange}
      />
      <NotebookBackButton notebookHref={notebookHref} onLeave={handleLeave} />
      <div className="editing-page-workspace" data-panel-hidden={isPanelHidden}>
        <section className="editing-page-page-section" ref={pageSectionRef}>
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
              rightPageIndex={isTurning ? moveTargetRightIndex : rightPageIndex}
              settledPageIndex={rightPageIndex}
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
          isHidden={isPanelHidden}
          onToggle={handleTogglePanel}
        />
      </div>
    </div>
  );
}
