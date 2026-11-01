"use client";

import type { NotebookCoverStyle } from "@/types/Notebook";
import type { HiddenSide } from "./TemplateCarouselLayout";
import type { ReadCoverScreenRect } from "@/components/3DScene/TemplateCarousel/CoverScreenRect";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { PageFlipButton } from "@/components/PageFlipButton";
import { TemplateTile } from "./TemplateTile";
import { NewNotebookPopup } from "./NewNotebookPopup/NewNotebookPopup";
import {
  COVER_MOVE_DURATION_MS,
  getLoopedOffset,
  moveStartIndex,
} from "./TemplateCarouselLayout";
import "./TemplatePicker.css";

// Loaded only in the browser and in its own file, since 3D can't be drawn
// on the server and three.js is a big download
const TemplateCarouselScene = dynamic(
  () =>
    import("@/components/3DScene/TemplateCarousel/TemplateCarouselScene").then(
      (module) => module.TemplateCarouselScene,
    ),
  { ssr: false },
);

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

  // The cover whose new notebook popup is showing, and where it opens from
  const [openedCover, setOpenedCover] = useState<{
    coverStyle: NotebookCoverStyle;
    startRect: DOMRect;
  } | null>(null);

  // The cover whose button has keyboard focus, which lifts its notebook
  const [focusedCover, setFocusedCover] = useState<NotebookCoverStyle | null>(
    null,
  );

  // Set by the 3D scene, to find where a notebook is drawn on screen
  const readRectRef = useRef<ReadCoverScreenRect | null>(null);

  // The popup opens from where the chosen notebook is drawn
  function openCover(coverStyle: NotebookCoverStyle) {
    const startRect = readRectRef.current?.(coverStyle);
    if (startRect) setOpenedCover({ coverStyle, startRect });
  }

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

  // Each template's place from the center, shared by the 3D notebooks and
  // the buttons over them
  const covers = coverStyles.map((coverStyle, index) => ({
    coverStyle,
    offset: getLoopedOffset(index, startIndex, hiddenSide, coverStyles.length),
  }));

  return (
    <section className="user-notebooks-page-template-picker">
      <TemplateCarouselScene
        covers={covers}
        isJumping={isJumping}
        focusedCover={focusedCover}
        openedCover={openedCover?.coverStyle ?? null}
        readRectRef={readRectRef}
        onOpenCover={openCover}
      />

      <PageFlipButton
        direction="previous"
        label="Previous templates"
        onClick={() => handleMove("previous")}
      />

      <div className="user-notebooks-page-template-picker-carousel">
        {covers.map(({ coverStyle, offset }) => (
          <TemplateTile
            key={coverStyle}
            coverStyle={coverStyle}
            offset={offset}
            onOpen={() => openCover(coverStyle)}
            onFocusChange={(isFocused) =>
              setFocusedCover((current) =>
                isFocused ? coverStyle : current === coverStyle ? null : current,
              )
            }
          />
        ))}
      </div>

      <PageFlipButton
        direction="next"
        label="Next templates"
        onClick={() => handleMove("next")}
      />

      {openedCover && (
        <NewNotebookPopup
          coverStyle={openedCover.coverStyle}
          startRect={openedCover.startRect}
          onClose={() => setOpenedCover(null)}
        />
      )}
    </section>
  );
}
