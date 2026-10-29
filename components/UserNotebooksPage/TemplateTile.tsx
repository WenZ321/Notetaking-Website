"use client";

import type { NotebookState, NotebookPaperType } from "@/types/Notebook";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_VARIABLES,
} from "@/constants/NotebookPageConstants";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { NotebookPaper } from "@/components/NotebookPaperTypes/NotebookPaper";
import { NOTEBOOK_PAPER_TYPES } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import "./TemplateTile.css";

const TEMPLATE_CARD_WIDTH = 150;
const TEMPLATE_CARD_HEIGHT = 225;

type TemplateTileProps = {
  paperType: NotebookPaperType;
};

/**
 * A template tile previewing its paper style, which creates a new notebook with that paper type when clicked
 */
export function TemplateTile({ paperType }: TemplateTileProps) {
  const router = useRouter();

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook() {
    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      // Every notebook is blue until the template tiles show cover styles
      coverStyle: "blue",
      paperType,
      pages: [
        createNotebookCover(),
        createEmptyNotebookPage(1),
        createEmptyNotebookPage(2),
      ],
    };

    await createNotebook(notebook);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/userNotebooks/${notebook.id}`);
  }

  return (
    <div
      className="user-notebooks-page-template-tile"
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          "--template-card-width": `${TEMPLATE_CARD_WIDTH}px`,
          "--template-card-height": `${TEMPLATE_CARD_HEIGHT}px`,
          "--template-card-scale": TEMPLATE_CARD_HEIGHT / NOTEBOOK_PAGE_HEIGHT,
        } as React.CSSProperties
      }
    >
      <div className="user-notebooks-page-template-tile-card">
        <div className="user-notebooks-page-template-tile-paper">
          <NotebookPaper paperType={paperType} />
        </div>
      </div>

      <button
        className="user-notebooks-page-template-tile-button"
        onClick={handleCreateNotebook}
      >
        {NOTEBOOK_PAPER_TYPES[paperType].label}
      </button>
    </div>
  );
}
