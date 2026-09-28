"use client";

import type { NotebookState, NotebookTemplate } from "@/types/notebook";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/notebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/components/NotebookPage/createNotebookPages";
import { NotebookPaper } from "@/components/NotebookTemplates/NotebookPaper";
import { NOTEBOOK_TEMPLATES } from "@/components/NotebookTemplates/notebookTemplates";
import "./TemplateTile.css";

const TEMPLATE_CARD_WIDTH = 150;
const TEMPLATE_CARD_HEIGHT = 225;

type TemplateTileProps = {
  template: NotebookTemplate;
};

/**
 * A template tile previewing its paper style, which creates a new notebook using that template when clicked
 */
export function TemplateTile({ template }: TemplateTileProps) {
  const router = useRouter();

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook() {
    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      template,
      totalPages: 2,
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
          "--template-card-width": `${TEMPLATE_CARD_WIDTH}px`,
          "--template-card-height": `${TEMPLATE_CARD_HEIGHT}px`,
          "--template-card-scale": TEMPLATE_CARD_HEIGHT / NOTEBOOK_PAGE_HEIGHT,
          "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
          "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
        } as React.CSSProperties
      }
    >
      <div className="user-notebooks-page-template-tile-card">
        <div className="user-notebooks-page-template-tile-paper">
          <NotebookPaper template={template} />
        </div>
      </div>

      <button
        className="user-notebooks-page-template-tile-button"
        onClick={handleCreateNotebook}
      >
        {NOTEBOOK_TEMPLATES[template].label}
      </button>
    </div>
  );
}
