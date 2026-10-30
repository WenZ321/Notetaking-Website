"use client";

import type { NotebookCoverStyle } from "@/types/Notebook";
import { useRef, useState } from "react";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { PageFlipButton } from "@/components/PageFlipButton";
import { TemplateTile } from "./TemplateTile";
import {
  COVER_MOVE_DURATION_MS,
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

  // On while the covers glide. A ref changes right away, so even two very quick clicks can't both get through
  const isMovingRef = useRef(false);

  // Ignores clicks until the covers finish gliding to their new places
  function handleMove(direction: "previous" | "next") {
    if (isMovingRef.current) return;

    isMovingRef.current = true;
    setStartIndex(moveStartIndex(startIndex, direction, coverStyles.length));

    setTimeout(() => {
      isMovingRef.current = false;
    }, COVER_MOVE_DURATION_MS);
  }

  return (
    <section className="user-notebooks-page-template-picker">
      <PageFlipButton
        direction="previous"
        label="Previous templates"
        onClick={() => handleMove("previous")}
      />

      <div
        className="user-notebooks-page-template-picker-carousel"
        style={
          {
            "--cover-middle-reach": MIDDLE_REACH,
            "--cover-move-duration": `${COVER_MOVE_DURATION_MS}ms`,
          } as React.CSSProperties
        }
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
        onClick={() => handleMove("next")}
      />
    </section>
  );
}
