"use client";

import type { NotebookState, NotebookTemplate } from "@/types/notebook";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/notebookDB";
import { NotebookPaper } from "@/components/NotebookTemplates/NotebookPaper";
import { NOTEBOOK_TEMPLATES } from "@/components/NotebookTemplates/notebookTemplates";
import "./NotebooksPreviewTemplates.css";

const TEMPLATE_CARD_WIDTH = 150;
const TEMPLATE_CARD_HEIGHT = 225;

type NotebooksPreviewTemplateProps = {
  template: NotebookTemplate;
};

/**
 * A template tile previewing its paper style, which creates a new notebook using that template when clicked
 */
export function NotebooksPreviewTemplate({
  template,
}: NotebooksPreviewTemplateProps) {
  const router = useRouter();

  // Makes sure to create the notebook before sending users to the site
  async function handleCreateNotebook() {
    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      template,
      totalPages: 0,
      pages: [],
    };

    await createNotebook(notebook);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/userNotebooks/${notebook.id}`);
  }

  return (
    <div
      className="user-notebooks-page-notebook-preview-template"
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
      <div className="user-notebooks-page-notebook-preview-template-card">
        <div className="user-notebooks-page-notebook-preview-template-paper">
          <NotebookPaper template={template} />
        </div>
      </div>

      <button
        className="user-notebooks-page-notebook-preview-template-button"
        onClick={handleCreateNotebook}
      >
        {NOTEBOOK_TEMPLATES[template].label}
      </button>
    </div>
  );
}
