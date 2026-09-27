import type { JSONContent } from "@tiptap/core";

// Shared shape of a notebook and its pages, as stored in the database.
export type NotebookPageState = {
  id: string;
  pageNumber: number;
  content: JSONContent;
};

// Paper style every page in the notebook is drawn with, one per template component
export type NotebookTemplate = "blank" | "lined";

export type NotebookState = {
  id: string;
  title: string;
  template: NotebookTemplate;
  totalPages: number;
  pages: NotebookPageState[];
};
