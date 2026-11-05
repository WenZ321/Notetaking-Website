import type { NotebookPageState, NotebookPaperType } from "@/types/Notebook";
import { useLayoutEffect, useRef } from "react";
import { TipTapContentRenderer } from "@/tiptap/TipTapContentRenderer/TipTapContentRenderer";
import {
  ROW_BOX_CLASS,
  ROW_TOP_GAP_VARIABLE,
} from "@/tiptap/nodes/WrappedBlock/WrappedAttributes";
import { NotebookPaper } from "../NotebookPaperTypes/NotebookPaper";
import { getPaperBlockTopStep } from "../NotebookPaperTypes/NotebookPaperTypes";
import { readRowTopGaps } from "../NotebookPaperTypes/PaperLogic/PaperSnapping";
import "./NotebookSheet.css";

type NotebookSheetProps = {
  page: NotebookPageState | undefined;
  paperType: NotebookPaperType;
  // opens this page in the editor, from where its paper is on screen
  onOpen: (pageId: string, paperRect: DOMRect) => void;
};

/**
 * One page in the notebook view, a read-only view of its content that opens the editor when clicked
 */
export function NotebookSheet({ page, paperType, onOpen }: NotebookSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Rows start on the paper's lines here too, so the page matches the editor
  useLayoutEffect(() => {
    const rows = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(`.${ROW_BOX_CLASS}`) ?? [],
    );
    const gaps = readRowTopGaps(rows, getPaperBlockTopStep(paperType));
    rows.forEach((row, index) => {
      row.style.setProperty(ROW_TOP_GAP_VARIABLE, `${gaps[index]}px`);
    });
  }, [page?.content, paperType]);

  // Every visible page already exists, since notebooks start with the cover and pages 1 and 2
  // and flipping forward creates the rest
  const handleEnterEditMode = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!page) return;
    onOpen(page.id, event.currentTarget.getBoundingClientRect());
  };

  return (
    <div
      ref={sheetRef}
      className="notebook-page-notebook-sheet-content notebook-page-text"
      data-page-id={page?.id}
      onClick={handleEnterEditMode}
    >
      <NotebookPaper paperType={paperType} />
      {page && <TipTapContentRenderer content={page.content} />}
    </div>
  );
}
