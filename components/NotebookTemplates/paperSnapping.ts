// The smallest and largest length a block is allowed to be
export type LengthLimits = {
  min: number;
  max: number;
};

// Takes the length a block wants and returns the length it gets on a
// paper, always within the limits
export type SnapLength = (length: number, limits?: LengthLimits) => number;

export const NO_LIMITS: LengthLimits = { min: 0, max: Infinity };

// For papers with nothing to line up with, a length only stays within its limits
export const keepLength: SnapLength = (length, { min, max } = NO_LIMITS) => {
  return Math.min(Math.max(length, min), max);
};
