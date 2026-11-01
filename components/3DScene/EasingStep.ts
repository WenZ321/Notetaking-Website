// The longest one frame can count as. The scenes only draw while something
// moves, so the first frame after sitting still reports all the time it sat
// still, which would finish an animation in one jump
const LONGEST_FRAME_SECONDS = 1 / 30;

/**
 * How much of the way left an easing animation covers this frame. A higher
 * speed covers more, and it never goes past the end
 * @param secondsSinceLastFrame The time since the last frame was drawn
 * @param speed How quickly the animation eases in
 * @returns The share of the way left to cover, from 0 to 1
 */
export function getEasingStep(
  secondsSinceLastFrame: number,
  speed: number,
): number {
  const frameSeconds = Math.min(secondsSinceLastFrame, LONGEST_FRAME_SECONDS);
  return Math.min(1, frameSeconds * speed);
}
