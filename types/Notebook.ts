import type { JSONContent } from "@tiptap/core";

// Shared shape of a notebook and its pages, as stored in the database.
// The cover always sits at index 0, so every page number matches its index
export type NotebookPageType = "cover" | "page";

export type NotebookPageState = {
  id: string;
  type: NotebookPageType;
  pageNumber: number;
  content: JSONContent;
};

// Paper style every page in the notebook is drawn with, one per template component
export type NotebookTemplate = "blank" | "lined" | "graph" | "dotGrid";

export type NotebookState = {
  id: string;
  title: string;
  template: NotebookTemplate;
  pages: NotebookPageState[];
};
