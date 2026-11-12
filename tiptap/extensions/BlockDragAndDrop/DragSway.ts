import type { EditorView } from "@tiptap/pm/view";
import { isReducedMotion } from "@/components/ReducedMotion/ReducedMotion";
import { blockDragPluginKey } from "./DragState";

// How strongly the lean follows the cursor's speed, its widest lean in
// degrees, and how slowly it straightens. Tuned by hand in a mockup
const SWAY_GAIN = 2.8;
const SWAY_MAX = 8;
const SWAY_HOLD = 0.9;

// How much of the way to the wanted lean it goes each frame, so it eases
// instead of jittering
const SWAY_EASE = 0.25;

// Read by the held copy's CSS, and by the dropped block as it settles
const SWAY_PROPERTY = "--drag-sway";
const SETTLE_SWAY_PROPERTY = "--settle-sway";

// The lean of a drag in progress, and where the cursor last was
type Sway = {
  angle: number;
  target: number;
  lastX: number;
  lastTime: number;
};

const sways = new WeakMap<EditorView, Sway>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Leans the held block toward where the cursor moves, faster moves leaning
 * further. The first call of a drag starts the lean
 * @param view The editor
 * @param clientX Where the cursor is across the screen
 */
export function feedSway(view: EditorView, clientX: number) {
  if (isReducedMotion()) return;

  const now = performance.now();
  const sway = sways.get(view);
  if (!sway) {
    const started = { angle: 0, target: 0, lastX: clientX, lastTime: now };
    sways.set(view, started);
    requestAnimationFrame(() => drawSway(view, started));
    return;
  }

  // the browser can send two moves at almost the same moment, so the time
  // between them counts as at least 8ms to keep the speed sensible
  const elapsed = Math.max(8, now - sway.lastTime);
  const speed = (clientX - sway.lastX) / elapsed;
  sway.target = clamp(sway.target + speed * SWAY_GAIN, -SWAY_MAX, SWAY_MAX);
  sway.lastX = clientX;
  sway.lastTime = now;
}

/**
 * Draws the lean each frame, letting it straighten on its own, until the
 * drag ends
 * @param view The editor
 * @param sway The drag's lean
 */
function drawSway(view: EditorView, sway: Sway) {
  if (!blockDragPluginKey.getState(view.state)) {
    sways.delete(view);
    view.dom.style.removeProperty(SWAY_PROPERTY);
    return;
  }

  sway.target *= SWAY_HOLD;
  sway.angle += (sway.target - sway.angle) * SWAY_EASE;
  view.dom.style.setProperty(SWAY_PROPERTY, `${sway.angle.toFixed(2)}deg`);
  requestAnimationFrame(() => drawSway(view, sway));
}

// Keeps the lean the block had when it was let go, so it can turn back
// straight as it settles
export function keepSwayForSettle(view: EditorView) {
  const angle = sways.get(view)?.angle ?? 0;
  view.dom.style.setProperty(SETTLE_SWAY_PROPERTY, `${angle.toFixed(2)}deg`);
}

export function clearSettleSway(view: EditorView) {
  view.dom.style.removeProperty(SETTLE_SWAY_PROPERTY);
}
