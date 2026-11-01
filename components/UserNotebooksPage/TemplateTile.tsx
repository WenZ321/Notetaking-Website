"use client";

import type {
  NotebookState,
  NotebookCoverStyle,
  NotebookPaperType,
} from "@/types/Notebook";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { OpeningNotebook } from "./NewNotebookPopup/OpeningNotebook";
import {
  MIDDLE_REACH,
  VISIBLE_SIDE_COVERS,
  getCoverSide,
} from "./TemplateCarouselLayout";
import "./TemplateTile.css";

type TemplateTileProps = {
  coverStyle: NotebookCoverStyle;
  offset: number; // Places from the center of the middle, negative to the left
};

/**
 * A template tile showing a cover style's front. Clicking it opens the notebook in the center of the page,
 * where the user names it and picks its paper before creating it
 */
export function TemplateTile({ coverStyle, offset }: TemplateTileProps) {
  const router = useRouter();
  // Where the tile sat when clicked, kept while its opening notebook shows
  const [openedFromRect, setOpenedFromRect] = useState<DOMRect | null>(null);
  // A second click while the first notebook is still saving would make a copy
  const isCreatingRef = useRef(false);
  const { label, className } = NOTEBOOK_COVER_STYLES[coverStyle];

  const side = getCoverSide(offset);
  // How many places past the middle a side cover sits, 0 for middle covers
  const depth = side === "middle" ? 0 : Math.abs(offset) - MIDDLE_REACH;
  const isHidden = depth > VISIBLE_SIDE_COVERS;

  // Starts with the cover and pages 1 and 2 so the first pair always exists, then creates the notebook before navigating
  async function handleCreateNotebook(
    title: string,
    paperType: NotebookPaperType,
  ) {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    const notebook: NotebookState = {
      id: crypto.randomUUID(),
      title,
      coverStyle,
      paperType,
      pages: [
        createNotebookCover(),
        createEmptyNotebookPage(1),
        createEmptyNotebookPage(2),
      ],
    };

    await createNotebook(notebook);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/userNotebooks/${notebook.id}`);
  }

  // Hidden covers stay in place so they can glide back in, but can't be clicked, tabbed to or read out
  return (
    <>
      <button
        className={`user-notebooks-page-template-tile-cover ${className}`}
        data-side={side}
        data-hidden={isHidden}
        tabIndex={isHidden ? -1 : 0}
        aria-hidden={isHidden}
        data-opened={openedFromRect !== null}
        style={
          {
            "--cover-offset": offset,
            "--cover-depth": depth,
          } as React.CSSProperties
        }
        aria-label={label}
        onClick={(event) =>
          setOpenedFromRect(event.currentTarget.getBoundingClientRect())
        }
      >
        {/* The notebook's two long edges, turned back to give the cover thickness */}
        <span className="user-notebooks-page-template-tile-spine-edge" />
        <span className="user-notebooks-page-template-tile-page-edge" />
      </button>

      {openedFromRect && (
        <OpeningNotebook
          coverClassName={className}
          startRect={openedFromRect}
          onCreate={handleCreateNotebook}
          onClose={() => setOpenedFromRect(null)}
        />
      )}
    </>
  );
}
