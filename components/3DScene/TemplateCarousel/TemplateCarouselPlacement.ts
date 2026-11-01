import type { CoverSide } from "@/components/UserNotebooksPage/TemplateCarouselLayout";
import {
  MIDDLE_REACH,
  VISIBLE_SIDE_COVERS,
  getCoverSide,
} from "@/components/UserNotebooksPage/TemplateCarouselLayout";
import { NOTEBOOK_WIDTH } from "../NotebookModel/NotebookLook";

// The carousel's spacing, in scene units where a notebook is 1 tall
const NOTEBOOK_GAP = 0.12;
const MIDDLE_STEP = NOTEBOOK_WIDTH + NOTEBOOK_GAP;
const SIDE_STACK_STEP = NOTEBOOK_WIDTH * 0.45;

// Side notebooks turn in toward the middle, and each one sits further back
// than the one before it, so the fog fades it more
const SIDE_TURN = (55 * Math.PI) / 180;
const SIDE_DEPTH_STEP = 0.5;

// Where one notebook sits in the scene, and whether it's too far out to show
export type NotebookPlacement = {
  position: [number, number, number];
  turn: number;
  isHidden: boolean;
};

// Which way a side points along the x axis, left being negative
const SIDE_DIRECTION: Record<Exclude<CoverSide, "middle">, number> = {
  left: -1,
  right: 1,
};

/**
 * Places a notebook by its distance from the middle of the carousel
 * @param offset Places from the center of the middle, negative to the left
 * @returns Where it sits, how far it's turned, and whether it's hidden
 */
export function getNotebookPlacement(offset: number): NotebookPlacement {
  const side = getCoverSide(offset);
  if (side === "middle") {
    return { position: [offset * MIDDLE_STEP, 0, 0], turn: 0, isHidden: false };
  }

  // how many places past the middle it sits, 1 for the first side notebook
  const depth = Math.abs(offset) - MIDDLE_REACH;
  const direction = SIDE_DIRECTION[side];
  const distance =
    MIDDLE_REACH * MIDDLE_STEP + NOTEBOOK_GAP + depth * SIDE_STACK_STEP;

  return {
    position: [direction * distance, 0, -depth * SIDE_DEPTH_STEP],
    turn: -direction * SIDE_TURN,
    isHidden: depth > VISIBLE_SIDE_COVERS,
  };
}
