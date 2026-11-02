"use client";

import type { ReactNode } from "react";
import type { NotebookSummary } from "@/types/Notebook";
import { createContext, use, useState } from "react";

// A new notebook whose cover just closed in the popup at coverRect on
// screen, for the bookshelf to fly down onto the table. The bookshelf calls
// onFlightStart once its 3D copy is drawn over the cover, and onLanded once
// it's on the table
export type CreatingNotebook = {
  notebook: NotebookSummary;
  coverRect: DOMRect;
  onFlightStart: () => void;
  onLanded: () => void;
};

type CreatingNotebookContextValue = {
  creating: CreatingNotebook | null;
  setCreating: (creating: CreatingNotebook) => void;
};

const CreatingNotebookContext =
  createContext<CreatingNotebookContextValue | null>(null);

// Lets the new notebook popup hand its notebook to the bookshelf, which are
// separate parts of the notebooks page
export function CreatingNotebookProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [creating, setCreating] = useState<CreatingNotebook | null>(null);
  return (
    <CreatingNotebookContext value={{ creating, setCreating }}>
      {children}
    </CreatingNotebookContext>
  );
}

export function useCreatingNotebook() {
  const value = use(CreatingNotebookContext);
  if (!value) {
    throw new Error("useCreatingNotebook needs a CreatingNotebookProvider");
  }
  return value;
}
