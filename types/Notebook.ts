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

// Paper style every page in the notebook is drawn with, one per paper component
export type NotebookPaperType = "blank" | "lined" | "graph" | "dotGrid";

// Look of the notebook's front cover and of its inside, the rim around the open pages
export type NotebookCoverStyle =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "brown"
  | "gray"
  | "lavender"
  | "mint";

export type NotebookState = {
  id: string;
  title: string;
  coverStyle: NotebookCoverStyle;
  paperType: NotebookPaperType;
  pages: NotebookPageState[];
};
