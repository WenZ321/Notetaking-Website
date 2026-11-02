import { NOTEBOOK_HEIGHT } from "../NotebookModel/NotebookLook";

// Every setting for how the 3D bookshelf looks. Sizes are in scene units,
// where a notebook is 1 tall

// Shelf notebooks are thicker than the carousel's, with a spine 40 wide
// for every 225 tall
export const SHELF_NOTEBOOK_THICKNESS = (NOTEBOOK_HEIGHT * 40) / 225;

// How thick the white boards are, and how deep the shelf goes back
export const SHELF_BOARD_THICKNESS = 0.08;
export const SHELF_DEPTH = 0.9;

// The room above the notebooks, the space at each end of a row, and the
// gap between notebooks
export const SHELF_TOP_GAP = 0.16;
export const SHELF_END_SPACE = 0.03;
export const SHELF_NOTEBOOK_GAP = 0.026;

// One row's height inside the boards
export const SHELF_ROW_HEIGHT = NOTEBOOK_HEIGHT + SHELF_TOP_GAP;

// The shelf always has at least this many rows, and gets more as
// notebooks fill them
export const MIN_SHELF_ROWS = 4;

// How big the shelf is on the page: as wide as SHELF_WIDTH_SHARE of the
// window, and each row, with a board, as tall as a one-row shelf that's
// ROW_HEIGHT_SHARE of the window's height
export const SHELF_WIDTH_SHARE = 0.8;
export const ROW_HEIGHT_SHARE = 0.25;
export const ONE_ROW_SHELF_HEIGHT =
  SHELF_ROW_HEIGHT + 2 * SHELF_BOARD_THICKNESS;

// White boards around a light grey back, like the page's grey bands. The
// boards get a faint line along their edges, so they stand out from the
// white wall behind them
export const SHELF_BOARD_COLOR = "#ffffff";
export const SHELF_EDGE_COLOR = "#d4d4d4";
export const SHELF_BACK_COLOR = "rgb(243, 243, 243)";
export const SHELF_ROUGHNESS = 0.9;

// The camera looks down at the shelf from a little above, so the tops of the
// notebooks and the shelf's floor show. 0 would face it straight on.
// Its view angle sets how strong the perspective is, smaller is flatter
export const LOOK_DOWN_DEGREES = 8;
export const CAMERA_VIEW_DEGREES = 12;

// The light comes mostly from in front, a little above and to the right, so
// the top board shades the back just under it and the shelf's shadow falls
// just below it on the wall. How blurred the shadows' edges are, higher is softer
export const SHELF_LIGHT_POSITION: [number, number, number] = [1, 3, 8];

// While a notebook flies down, the light moves to high above the table on
// the shelf's side and a little left, so the landed notebook's shadow falls
// a little right and down on screen, like light from the top of the page
export const TABLE_LIGHT_POSITION: [number, number, number] = [-1, 6, -2];

// The flying notebook's cover is fully matte, since with the light overhead
// a shiny one glints and lands lighter than the notebook view's cover
export const FLYING_COVER_ROUGHNESS = 1;
export const SHADOW_SOFTNESS = 6;

// The wall behind the shelf, the page's white, which the shelf casts its
// shadow on. The canvas reaches this far past the shelf on each side, in
// pixels, so the shadow has room
export const WALL_COLOR = "#ffffff";
export const WALL_MARGIN_X = 60;
export const WALL_MARGIN_Y = 60;

// The title on each spine, in the app's font, read top to bottom. It fits in
// SPINE_TITLE_LENGTH, shrinking from the usual size down to the smallest
// before long titles are cut off with "…". An average letter is about
// AVERAGE_LETTER_WIDTH of the text size wide
// The 3D text can't read .woff2, so Inter is also kept as a .ttf
export const SPINE_TITLE_FONT = "/fonts/inter-regular.ttf";
export const SPINE_TITLE_LENGTH = NOTEBOOK_HEIGHT - 0.16;
export const SPINE_TITLE_SIZE = 0.07;
export const SPINE_TITLE_SMALLEST_SIZE = 0.05;
export const AVERAGE_LETTER_WIDTH = 0.64;

// Titles are dark on light spines and light on dark ones
export const SPINE_TITLE_DARK = "#1f1f1f";
export const SPINE_TITLE_LIGHT = "#f7f7f7";

// How a notebook pulls out when hovered or focused: it slides out toward
// you, rises a little, and tips its top toward you a bit, turning on its
// bottom front edge. A higher speed gets there quicker
export const PULL_OUT_SLIDE = 0.45;
export const PULL_OUT_LIFT = 0.03;
export const PULL_OUT_TILT_DEGREES = 8;
export const PULL_OUT_SPEED = 15;

// Opening a notebook: it slides straight out of the shelf, this far, over
// OPEN_SLIDE_MS. Then for OPEN_FLIGHT_MS the camera tips down to the table
// while the notebook flies down onto it, landing flat with its cover up,
// right where the notebook view draws its cover
export const OPEN_SLIDE = 1.1;
export const OPEN_SLIDE_MS = 400;
export const OPEN_FLIGHT_MS = 1000;

// Once the notebook starts flying down, the wall around the shelf and the
// table fade in over the page over this long, so the page fades away while
// the notebook moves down instead of before
export const SURROUND_FADE_MS = 400;

// The table the notebook lands on, below and in front of the shelf. It's
// only there while a notebook opens. The notebook view's background,
// --color-table, is the same color, so keep the two matching
export const TABLE_COLOR = "#f1ece4";
export const TABLE_SIZE: [number, number, number] = [8, 0.1, 4];
export const TABLE_BELOW_SHELF = 0.4;
export const TABLE_IN_FRONT = 2.5;
