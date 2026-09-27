import type { NotebookPageState } from "@/types/notebook";

// A new page with a single empty paragraph, ready to be saved to a notebook
export function createEmptyNotebookPage(pageNumber: number): NotebookPageState {
  return {
    id: crypto.randomUUID(),
    pageNumber,
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
  };
}
