// Every setting for a notebook flying down onto the table as it opens.
// Sizes are in scene units, where a notebook is 1 tall

// For FLIGHT_MS the camera tips down to the table while the notebook flies
// down onto it, landing flat with its cover up, right where the notebook
// view draws its cover
export const FLIGHT_MS = 1000;

// Once the notebook starts flying down, the wall and the table fade in over
// the page over this long, so the page fades away while the notebook moves
// down instead of before
export const SURROUND_FADE_MS = 400;

// The wall the table stands against, the page's white
export const WALL_COLOR = "#ffffff";

// The table the notebook lands on, its middle this far toward you from the
// scene's middle.
// It's only there while a notebook opens. The notebook view's background,
// --color-table, is the same color, so keep the two matching
export const TABLE_COLOR = "#f1ece4";
export const TABLE_ROUGHNESS = 0.9;
export const TABLE_SIZE: [number, number, number] = [8, 0.1, 4];
export const TABLE_IN_FRONT = 4;

// While a notebook flies down, the light moves to high above the table on
// the wall's side and a little left, so the landed notebook's shadow falls
// a little right and down on screen, like light from the top of the page
export const TABLE_LIGHT_POSITION: [number, number, number] = [-1, 6, -2];

// The flying notebook's cover is fully matte, since with the light overhead
// a shiny one glints and lands lighter than the notebook view's cover
export const FLYING_COVER_ROUGHNESS = 1;
