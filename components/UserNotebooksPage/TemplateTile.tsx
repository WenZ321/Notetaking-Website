"use client";

import type { NotebookCoverStyle } from "@/types/Notebook";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import {
  MIDDLE_REACH,
  VISIBLE_SIDE_COVERS,
  getCoverSide,
} from "./TemplateCarouselLayout";

type TemplateTileProps = {
  coverStyle: NotebookCoverStyle;
  offset: number; // Places from the center of the middle, negative to the left
  onOpen: () => void;
  onFocusChange: (isFocused: boolean) => void;
};

/**
 * A template's button for the keyboard and screen readers. The 3D notebook
 * is what's seen and clicked, so the button itself is hidden, and focusing
 * it lifts its notebook instead of showing a focus ring
 */
export function TemplateTile({
  coverStyle,
  offset,
  onOpen,
  onFocusChange,
}: TemplateTileProps) {
  const { label } = NOTEBOOK_COVER_STYLES[coverStyle];

  // Notebooks too far out to show can't be tabbed to or read out
  const side = getCoverSide(offset);
  const depth = side === "middle" ? 0 : Math.abs(offset) - MIDDLE_REACH;
  const isHidden = depth > VISIBLE_SIDE_COVERS;

  return (
    <button
      className="visually-hidden"
      tabIndex={isHidden ? -1 : 0}
      aria-hidden={isHidden}
      aria-label={label}
      onClick={onOpen}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
    />
  );
}
