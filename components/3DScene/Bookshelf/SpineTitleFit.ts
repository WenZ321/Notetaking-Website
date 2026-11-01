import { Color } from "three";
import {
  AVERAGE_LETTER_WIDTH,
  SPINE_TITLE_DARK,
  SPINE_TITLE_LENGTH,
  SPINE_TITLE_LIGHT,
  SPINE_TITLE_SIZE,
  SPINE_TITLE_SMALLEST_SIZE,
} from "./BookshelfLook";

// A title as it fits on a spine, and the text size it's drawn at
export type SpineTitle = {
  text: string;
  size: number;
};

/**
 * Fits a title along a spine. It shrinks first, down to the smallest size,
 * and a title still too long at that size is cut off with "…"
 * @param title The notebook's title
 * @returns The text to draw and its size
 */
export function fitSpineTitle(title: string): SpineTitle {
  const lettersAtSize = (size: number) =>
    Math.floor(SPINE_TITLE_LENGTH / (size * AVERAGE_LETTER_WIDTH));

  const sizeToFit =
    SPINE_TITLE_LENGTH / (Math.max(title.length, 1) * AVERAGE_LETTER_WIDTH);
  const size = Math.max(
    SPINE_TITLE_SMALLEST_SIZE,
    Math.min(SPINE_TITLE_SIZE, sizeToFit),
  );

  const maxLetters = lettersAtSize(size);
  if (title.length <= maxLetters) return { text: title, size };
  return { text: `${title.slice(0, maxLetters - 1).trimEnd()}…`, size };
}

/**
 * Picks dark or light title text, whichever stands out on the spine's color
 * @param spineColor The spine's color
 * @returns The title's color
 */
export function getSpineTitleColor(spineColor: string): string {
  const { r, g, b } = new Color(spineColor);
  // how bright the color looks, green counting most and blue least. Past
  // 0.179, dark text stands out more than light text does
  const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return brightness > 0.179 ? SPINE_TITLE_DARK : SPINE_TITLE_LIGHT;
}
