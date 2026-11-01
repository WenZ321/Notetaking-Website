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

// One row's height inside the boards, and the whole shelf's height
export const SHELF_ROW_HEIGHT = NOTEBOOK_HEIGHT + SHELF_TOP_GAP;
export const SHELF_HEIGHT = SHELF_ROW_HEIGHT + 2 * SHELF_BOARD_THICKNESS;

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
export const SHADOW_SOFTNESS = 6;

// The wall behind the shelf, the page's white, which the shelf casts its
// shadow on. The canvas reaches this far past the shelf on each side, in
// pixels, so the shadow has room
export const WALL_COLOR = "#ffffff";
export const WALL_MARGIN_X = 60;
export const WALL_MARGIN_Y = 60;
