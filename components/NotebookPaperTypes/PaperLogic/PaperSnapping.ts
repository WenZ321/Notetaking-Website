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

/**
 * Finds the gap each row needs above it so its top lands on the paper's lines.
 * A gap moves everything below it, so that's counted for the rows after it
 * @param rows The page's row boxes, top of the page first
 * @param topStep How far apart the lines a row can start on are
 * @returns The gap each row needs, in the same order
 */
export function readRowTopGaps(rows: HTMLElement[], topStep: number): number[] {
  let shift = 0;
  return rows.map((row) => {
    const drawnGap = parseFloat(getComputedStyle(row).paddingTop);
    const top = row.offsetTop + shift;
    const gap = (topStep - (top % topStep)) % topStep;
    shift += gap - drawnGap;
    return gap;
  });
}
