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

/**
 * Starts slow, speeds up through the middle and settles gently into place,
 * the same curve as the CSS easing cubic-bezier(0.77, 0, 0.175, 1)
 * @param progress How far along, from 0 to 1
 * @returns How far along it looks, from 0 to 1
 */
export function easeInOutQuart(progress: number): number {
  return progress < 0.5
    ? 8 * progress ** 4
    : 1 - (-2 * progress + 2) ** 4 / 2;
}
