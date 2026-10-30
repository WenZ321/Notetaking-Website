"use client";

import type { NotebookCoverStyle } from "@/types/Notebook";
import type { HiddenSide } from "./TemplateCarouselLayout";
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
  const [hiddenSide, setHiddenSide] = useState<HiddenSide>("right");

  // On while the hidden covers jump sides, so they move there instantly instead of gliding
  const [isJumping, setIsJumping] = useState(false);

  // On while the covers glide. A ref changes right away, so even two very quick clicks can't both get through
  const isMovingRef = useRef(false);

  // Ignores clicks until the covers finish gliding to their new places
  function handleMove(direction: "previous" | "next") {
    if (isMovingRef.current) return;
    isMovingRef.current = true;

    // The new covers come in from one side and the old ones leave by the other
    const incomingSide = direction === "next" ? "right" : "left";
    const outgoingSide = direction === "next" ? "left" : "right";

    // First the hidden covers jump to where the new ones come in from, out of sight
    setIsJumping(true);
    setHiddenSide(incomingSide);

    // Waits two frames so the jump is drawn before the glide starts.
    // The covers that leave then stay hidden on their own side, so none cross the middle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsJumping(false);
        setHiddenSide(outgoingSide);
        setStartIndex(
          moveStartIndex(startIndex, direction, coverStyles.length),
        );

        setTimeout(() => {
          isMovingRef.current = false;
        }, COVER_MOVE_DURATION_MS);
      });
    });
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
        data-jumping={isJumping}
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
            offset={getLoopedOffset(
              index,
              startIndex,
              hiddenSide,
              coverStyles.length,
            )}
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
