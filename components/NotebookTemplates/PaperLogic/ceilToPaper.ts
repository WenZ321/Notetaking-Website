import type { SnapBlockSide } from "./paperSnapping";

/**
 * Rounds a length up to the next one the paper allows, like the next whole
 * number of squares on graph paper, so it never ends up smaller. Papers
 * with nothing to line up with leave it as is
 * @param length The length to round up
 * @param snapBlockSide How the page's paper fits lengths
 * @returns The rounded length
 */
export function ceilToPaper(
  length: number,
  snapBlockSide: SnapBlockSide,
): number {
  return snapBlockSide(length, { min: length, max: Infinity });
}
