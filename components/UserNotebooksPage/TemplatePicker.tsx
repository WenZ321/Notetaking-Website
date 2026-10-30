"use client";

import type { NotebookCoverStyle } from "@/types/Notebook";
import { useState } from "react";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { PageFlipButton } from "@/components/PageFlipButton";
import { TemplateTile } from "./TemplateTile";
import {
  MIDDLE_REACH,
  getLoopedOffset,
  moveStartIndex,
} from "./TemplateCarouselLayout";
import "./TemplatePicker.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 * Four covers face you in the middle, the rest are angled off to the sides
 */
export function TemplatePicker() {
  const coverStyles = Object.keys(
    NOTEBOOK_COVER_STYLES,
  ) as NotebookCoverStyle[];

  // The first cover in the middle, starting with the first template
  const [startIndex, setStartIndex] = useState(0);

  return (
    <section className="user-notebooks-page-template-picker">
      <PageFlipButton
        direction="previous"
        label="Previous templates"
        onClick={() =>
          setStartIndex(
            moveStartIndex(startIndex, "previous", coverStyles.length),
          )
        }
      />

      <div
        className="user-notebooks-page-template-picker-carousel"
        style={{ "--cover-middle-reach": MIDDLE_REACH } as React.CSSProperties}
      >
        {coverStyles.map((coverStyle, index) => (
          <TemplateTile
            key={coverStyle}
            coverStyle={coverStyle}
            offset={getLoopedOffset(index, startIndex, coverStyles.length)}
          />
        ))}
      </div>

      <PageFlipButton
        direction="next"
        label="Next templates"
        onClick={() =>
          setStartIndex(moveStartIndex(startIndex, "next", coverStyles.length))
        }
      />
    </section>
  );
}
