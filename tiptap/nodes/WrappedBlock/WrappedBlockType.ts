// How a wrapped block sits with the text around it:
// left and right float the blocks to that side, and the page text after them wraps beside them and continues under them.
// newspaper keeps text on both sides of the blocks, which flows down the left side, then down the right side, then under the blocks
export type Wrap = "left" | "right" | "newspaper";

// What a new wrapped block starts as
export const DEFAULT_WRAP: Wrap = "left";
