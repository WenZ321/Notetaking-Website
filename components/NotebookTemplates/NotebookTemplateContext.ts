import type { NotebookTemplate } from "@/types/notebook";
import { createContext } from "react";

// The paper of the page being edited, so blocks on it can fit their size
// to it. Empty outside an editor
export const NotebookTemplateContext = createContext<
  NotebookTemplate | undefined
>(undefined);
