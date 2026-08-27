import type { JSONContent } from "@tiptap/core";

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
