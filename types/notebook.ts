import type { JSONContent } from "@tiptap/core";

// Shared shape of a notebook and its pages, as stored in the database.
export type NotebookPageState = {
  id: string;
  pageNumber: number;
  content: JSONContent;
};

export type NotebookState = {
  id: string;
  title: string;
  totalPages: number;
  pages: NotebookPageState[];
};
