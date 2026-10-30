// Where each cover sits in the templates carousel.
// Kept out of the client components so the server-rendered picker gets the real values

// Covers this many places from the center face you, so the middle shows five
export const MIDDLE_REACH = 2;

export type CoverSide = "left" | "middle" | "right";

// A cover's distance from the center, counted the short way around
// so the covers loop and the far ones wrap to the other side
export function getLoopedOffset(
  index: number,
  centerIndex: number,
  total: number,
) {
  const offset = index - centerIndex;
  const halfway = Math.floor(total / 2);

  if (offset > halfway) return offset - total;
  if (offset < -halfway) return offset + total;
  return offset;
}

// Which part of the carousel a cover sits in, from its distance to the center
export function getCoverSide(offset: number): CoverSide {
  if (offset < -MIDDLE_REACH) return "left";
  if (offset > MIDDLE_REACH) return "right";
  return "middle";
}
