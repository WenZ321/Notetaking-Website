import type { EditorView } from "@tiptap/pm/view";
import { blockDragPluginKey } from "./DragState";
import { readDrawnBlock } from "./DragGhost";
import { getSpotDom } from "./LivePreview";

// The dashed box showing where letting go lands. One box lasts the whole
// drag and slides to each new spot, so fast moves never make it blink or jump
const boxes = new WeakMap<EditorView, HTMLElement>();

/**
 * Shows the box for a drag, if it isn't already showing
 * @param view The editor
 */
export function startDropSpotBox(view: EditorView) {
  if (boxes.has(view)) return;

  const box = document.createElement("div");
  box.className = "drop-spot-box";
  box.setAttribute("aria-hidden", "true");
  document.body.append(box);
  boxes.set(view, box);
  requestAnimationFrame(() => followSpot(view, box));
}

/**
 * Moves the box over the spot each frame, until the drag ends
 * @param view The editor
 * @param box The dashed box
 */
function followSpot(view: EditorView, box: HTMLElement) {
  if (!blockDragPluginKey.getState(view.state)) {
    box.remove();
    boxes.delete(view);
    return;
  }

  const spotDom = getSpotDom(view);
  const spotRect = spotDom && readDrawnBlock(spotDom).getBoundingClientRect();
  // a new spot has no size until it's drawn, so the box waits for it
  const isDrawn = spotRect !== null && spotRect.width > 0;
  const wasShown = box.classList.contains("shown");
  if (!spotDom) {
    box.classList.remove("shown");
  } else if (isDrawn) {
    // shown again, it's placed at once instead of sliding from where it was
    box.classList.toggle("placing", !wasShown);
    box.classList.add("shown");
    box.style.setProperty("--box-x", `${spotRect.left}px`);
    box.style.setProperty("--box-y", `${spotRect.top}px`);
    box.style.setProperty("--box-width", `${spotRect.width}px`);
    box.style.setProperty("--box-height", `${spotRect.height}px`);
  }
  requestAnimationFrame(() => followSpot(view, box));
}
