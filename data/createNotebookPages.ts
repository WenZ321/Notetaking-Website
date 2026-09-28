import type { JSONContent } from "@tiptap/core";
import type { NotebookPageState } from "@/types/notebook";

// The cover always sits at index 0, so every page after it has a page number equal to its index
export const COVER_PAGE_INDEX = 0;

// A single empty paragraph, the starting content for new pages and the cover
function createEmptyContent(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [],
      },
    ],
  };
}

// A new page, ready to be saved to a notebook
export function createEmptyNotebookPage(pageNumber: number): NotebookPageState {
  return {
    id: crypto.randomUUID(),
    type: "page",
    pageNumber,
    content: createEmptyContent(),
  };
}

// The front cover, which always sits at COVER_PAGE_INDEX of a notebook's pages
export function createNotebookCover(): NotebookPageState {
  return {
    id: crypto.randomUUID(),
    type: "cover",
    pageNumber: COVER_PAGE_INDEX,
    content: createEmptyContent(),
  };
}
