import type { SnapLength } from "./paperSnapping";

/**
 * Rounds a length to the closest one the paper allows, like the nearest
 * whole number of squares on graph paper. Papers with nothing to line up
 * with leave it as is
 * @param length The length to round
 * @param snapLength How the page's paper fits lengths
 * @returns The rounded length
 */
export function roundToPaper(length: number, snapLength: SnapLength): number {
  return snapLength(length, { min: 0, max: Infinity });
}
