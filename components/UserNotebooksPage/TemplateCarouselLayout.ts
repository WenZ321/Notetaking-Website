// Where each cover sits in the templates carousel.
// Kept out of the client components so the server-rendered picker gets the real values

// How many covers face you at once, which is also how far the arrows move
export const MIDDLE_SIZE = 4;

// How far the outermost middle covers sit from the center.
// A half step when the middle has an even count, since the center falls between two covers
export const MIDDLE_REACH = (MIDDLE_SIZE - 1) / 2;

// How long the covers take to glide to their new places after an arrow click
export const COVER_MOVE_DURATION_MS = 400;

// How many angled covers show on each side, the ones further out are hidden
export const VISIBLE_SIDE_COVERS = 2;

export type CoverSide = "left" | "middle" | "right";

// Which side the hidden covers wait on, all of them on the same side
export type HiddenSide = "left" | "right";

// A cover's distance from the center of the middle, negative to the left.
// The covers loop, so the ones past one end wrap around to the other
export function getLoopedOffset(
  index: number,
  startIndex: number,
  hiddenSide: HiddenSide,
  total: number,
) {
  // The showing side covers always sit on the left, the hidden ones only when they wait there
  const hiddenCount = total - MIDDLE_SIZE - 2 * VISIBLE_SIDE_COVERS;
  const leftCount =
    hiddenSide === "left"
      ? VISIBLE_SIDE_COVERS + hiddenCount
      : VISIBLE_SIDE_COVERS;

  // Places from the first middle cover, kept between the far left and far right ends
  const placesFromStart = index - startIndex + leftCount;
  const loopedPlaces =
    (((placesFromStart % total) + total) % total) - leftCount;

  return loopedPlaces - MIDDLE_REACH;
}

// Which part of the carousel a cover sits in, from its distance to the center
export function getCoverSide(offset: number): CoverSide {
  if (offset < -MIDDLE_REACH) return "left";
  if (offset > MIDDLE_REACH) return "right";
  return "middle";
}

// The first middle cover after the arrows move a whole middle's worth, looping past either end
export function moveStartIndex(
  startIndex: number,
  direction: "previous" | "next",
  total: number,
) {
  const step = direction === "next" ? MIDDLE_SIZE : -MIDDLE_SIZE;
  const movedIndex = startIndex + step;

  // Remainders of negative numbers stay negative, so adding total back keeps it in range
  return ((movedIndex % total) + total) % total;
}
