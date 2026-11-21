import type { NotebookCoverStyle } from "@/types/Notebook";
import { createContext } from "react";

// The cover of the notebook being edited, so block editor popups can sit in
// its rim. The editing page always provides it, red is only the required default
export const NotebookCoverStyleContext =
  createContext<NotebookCoverStyle>("red");
