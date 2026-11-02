import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/NotebookPageConstants";

// Every setting for how the 3D notebooks look, so the look can be tuned in
// one place. Sizes are in scene units, where a notebook is 1 tall

// Shaped like a notebook page. NOTEBOOK_THICKNESS is the carousel's
// notebooks, 8% of the width; other places can draw them thicker
export const NOTEBOOK_HEIGHT = 1;
export const NOTEBOOK_WIDTH =
  (NOTEBOOK_HEIGHT * NOTEBOOK_PAGE_WIDTH) / NOTEBOOK_PAGE_HEIGHT;
export const NOTEBOOK_THICKNESS = NOTEBOOK_WIDTH * 0.08;

// How thick each cover board is, and how far the covers reach past the pages
export const COVER_BOARD_THICKNESS = 0.018;
export const COVER_OVERHANG = 0.015;

// Matte covers and paper, 0 is mirror shiny and 1 is fully matte
export const COVER_ROUGHNESS = 0.6;
export const PAGE_ROUGHNESS = 0.95;
export const PAGE_COLOR = "#f4efe3";

// A soft light everywhere, plus one from the side and above, so the faces
// shade differently and the edges catch a highlight. three.js divides light
// by pi like real light does, so these are set to light a front cover to
// about its own color, not darker
export const AMBIENT_LIGHT_STRENGTH = 2.2;
export const MAIN_LIGHT_STRENGTH = 2.5;
export const MAIN_LIGHT_POSITION: [number, number, number] = [3, 3, 2];

// The line along each edge of a notebook, so it stands out crisply.
// Its width is in screen pixels, so far notebooks get the same line. Its
// color is the part's own color times OUTLINE_SHADE, so a darker shade of it
export const OUTLINE_WIDTH = 2;
export const OUTLINE_SHADE = 0.65;

// The line down the front cover where the spine meets it, painted on the
// cover so it shows steadily from any angle, unlike the outline. Its width
// is a share of the notebook's, the same as the flat covers'
// --cover-spine-line-share, so keep the two matching
export const SPINE_LINE_WIDTH = NOTEBOOK_WIDTH * 0.005;

// How high a notebook rises when hovered or focused, and how quickly it
// gets there. Higher is quicker
export const LIFT_HEIGHT = 0.03;
export const LIFT_SPEED = 15;

// The faint shadow on the ground under each notebook
export const SHADOW_OPACITY = 0.5;
export const SHADOW_BLUR = 1.5;
