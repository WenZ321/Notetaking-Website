// The smallest and largest length the width/height of a block is allowed to be
// min is from the block's min width/height, or from the smallest size able to fit the content
// max is from the block's max width/height, or less when a row has less room
export type BlockSideLimits = {
  min: number;
  max: number;
};

// A function that takes the width/height of a side and returns a new length
// snapped to fit the paper, always within the limits
// Used for snapping logic on graph paper, etc
export type SnapBlockSide = (length: number, limits: BlockSideLimits) => number;

// For papers with no snapping logic, we just keep the length within the min/max limits
export const keepLength: SnapBlockSide = (length, { min, max }) => {
  return Math.min(Math.max(length, min), max);
};
