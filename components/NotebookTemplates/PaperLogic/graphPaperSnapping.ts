import type { SnapBlockSide } from "./paperSnapping";
import { keepLength } from "./paperSnapping";
import { GRAPH_PAPER_SQUARE_SIZE } from "@/constants/notebookPageConstants";

// Rounds a length to the closest whole number of squares that fits its
// limits, never less than one square
export const snapToGraphSquares: SnapBlockSide = (length, limits) => {
  const square = GRAPH_PAPER_SQUARE_SIZE;
  const smallestFit = Math.max(square, Math.ceil(limits.min / square) * square);
  const largestFit = Math.floor(limits.max / square) * square;

  // No whole number of squares fits, so it only stays within the limits
  if (smallestFit > largestFit) return keepLength(length, limits);

  const snapped = Math.round(length / square) * square;
  return keepLength(snapped, { min: smallestFit, max: largestFit });
};
