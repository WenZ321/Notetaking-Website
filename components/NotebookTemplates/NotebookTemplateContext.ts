import type { NotebookTemplate } from "@/types/notebook";
import { createContext } from "react";

// The paper of the page being edited, so blocks on it can fit their size
// to it. The editor always provides it, blank is only the required default
export const NotebookTemplateContext = createContext<NotebookTemplate>("blank");
