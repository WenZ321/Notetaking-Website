import type { ReactNode } from "react";
import type { NotebookPageState, NotebookState } from "@/types/Notebook";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
import { COVER_PAGE_INDEX } from "@/data/CreateNotebookPages";
import "./Notebook.css";

type NotebookProps = {
  notebook: NotebookState;
  leftPageIndex: number;
  settledPageIndex: number;
  renderPage: (page: NotebookPageState | undefined) => ReactNode;
  onTurnEnd: () => void;
};

type PageFrameProps = {
  page: NotebookPageState | undefined;
  side: "left" | "right";
  renderPage: (page: NotebookPageState | undefined) => ReactNode;
};

type TurningPageStripsProps = {
  frontPage: NotebookPageState | undefined;
  backPage: NotebookPageState | undefined;
  direction: "next" | "previous";
  renderPage: (page: NotebookPageState | undefined) => ReactNode;
};

// The first two pages, the ones right under the cover
const FIRST_PAGES_INDEX = COVER_PAGE_INDEX + 1;

// More strips make a smoother curve, but each one draws both pages again
const TURNING_PAGE_STRIP_COUNT = 10;

// One page in its frame with its number, drawn at the notebook's size
function PageFrame({ page, side, renderPage }: PageFrameProps) {
  return (
    <div className="notebook-page-frame">
      <div className="notebook-page-scaled">
        {renderPage(page)}
        {page && (
          <span className="notebook-page-number" data-side={side}>
            {page.pageNumber}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The turning page cut into thin strips from the spine out, each one hung on
 * the one before it. Each strip bends a little from the last, so together the
 * page curves. Each strip shows its own slice of both of the page's sides
 */
function TurningPageStrips({
  frontPage,
  backPage,
  direction,
  renderPage,
}: TurningPageStripsProps) {
  const frontSide = direction === "next" ? "right" : "left";
  const backSide = direction === "next" ? "left" : "right";

  // Built from the outer edge in, so each strip can hold the next one
  let strips: ReactNode = null;
  for (let index = TURNING_PAGE_STRIP_COUNT - 1; index >= 0; index--) {
    strips = (
      <div
        className="notebook-page-turning-strip"
        style={{ "--strip-index": index } as React.CSSProperties}
      >
        <div className="notebook-page-turning-strip-front">
          <PageFrame page={frontPage} side={frontSide} renderPage={renderPage} />
        </div>
        <div className="notebook-page-turning-strip-back">
          <PageFrame page={backPage} side={backSide} renderPage={renderPage} />
        </div>
        {strips}
      </div>
    );
  }
  return strips;
}

/**
 * A notebook lying on the table, closed or open to two pages, the same one
 * in the notebook view and the editor. The page holding it decides how each
 * page is drawn and how big it is, through --notebook-scale. While the
 * address points at other pages than the settled ones, the cover or a page
 * turns over on the spine to get there
 */
export function Notebook({
  notebook,
  leftPageIndex,
  settledPageIndex,
  renderPage,
  onTurnEnd,
}: NotebookProps) {
  const { pages } = notebook;
  const isCoverShown = leftPageIndex === COVER_PAGE_INDEX;
  const isTurning = settledPageIndex !== leftPageIndex;
  const isCoverTurning =
    isTurning && (isCoverShown || settledPageIndex === COVER_PAGE_INDEX);
  const pageTurnDirection =
    isTurning && !isCoverTurning
      ? leftPageIndex > settledPageIndex
        ? "next"
        : "previous"
      : null;

  // While closed, the first two pages already lie under the cover. While a
  // page turns, the side it leaves still shows the old page until it's
  // covered, and the side it uncovers already shows the new one
  let shownLeftPageIndex = isCoverShown ? FIRST_PAGES_INDEX : leftPageIndex;
  let shownRightPageIndex = shownLeftPageIndex + 1;
  if (pageTurnDirection === "next") shownLeftPageIndex = settledPageIndex;
  if (pageTurnDirection === "previous") {
    shownRightPageIndex = settledPageIndex + 1;
  }

  // The turning page has the page it leaves on its front, and the page it
  // lands as on its back
  const turningFrontIndex =
    pageTurnDirection === "next" ? settledPageIndex + 1 : settledPageIndex;
  const turningBackIndex =
    pageTurnDirection === "next" ? leftPageIndex : leftPageIndex + 1;

  // The cover or a page has finished turning, or with reduced motion, fading
  function handleTurnEnd(event: React.TransitionEvent | React.AnimationEvent) {
    if (event.target === event.currentTarget) onTurnEnd();
  }

  return (
    <div
      className="notebook-page-hardcover"
      data-open={!isCoverShown}
      style={getCoverColorVariables(notebook.coverStyle)}
      onAnimationEnd={handleTurnEnd}
    >
      <div className="notebook-page-back-cover">
        <PageFrame
          page={pages[shownRightPageIndex]}
          side="right"
          renderPage={renderPage}
        />
      </div>

      <div
        className="notebook-page-front-cover"
        onTransitionEnd={handleTurnEnd}
      >
        <div className="notebook-page-cover-outside" />
        <div className="notebook-page-cover-inside">
          <PageFrame
            page={pages[shownLeftPageIndex]}
            side="left"
            renderPage={renderPage}
          />
        </div>
      </div>

      {pageTurnDirection && (
        <div
          key={`${settledPageIndex}-${leftPageIndex}`}
          className="notebook-page-turning-page-shadow"
        >
          <div
            className="notebook-page-turning-page"
            data-direction={pageTurnDirection}
            style={
              {
                "--strip-count": TURNING_PAGE_STRIP_COUNT,
              } as React.CSSProperties
            }
            onAnimationEnd={handleTurnEnd}
          >
            <TurningPageStrips
              frontPage={pages[turningFrontIndex]}
              backPage={pages[turningBackIndex]}
              direction={pageTurnDirection}
              renderPage={renderPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
