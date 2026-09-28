import type { JSONContent } from "@tiptap/core";
import type { NotebookPageState } from "@/types/notebook";

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

// The front cover, which always sits at index 0 of a notebook's pages
export function createNotebookCover(): NotebookPageState {
  return {
    id: crypto.randomUUID(),
    type: "cover",
    pageNumber: 0,
    content: createEmptyContent(),
  };
}
