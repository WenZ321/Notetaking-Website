import type { EditorView } from "@tiptap/pm/view";
import { getPageScale } from "@/tiptap/PageScale";

// Where the dropped block comes down from, read by its settle
const SETTLE_FROM_PROPERTY = "--settle-from";

// The lifted copy of a dragged block that follows the cursor
const ghosts = new WeakMap<EditorView, HTMLElement>();

// The block as drawn, inside the holder the editor wraps it in
export function readDrawnBlock(holder: HTMLElement): HTMLElement {
  return (
    holder.querySelector<HTMLElement>(
      ".tiptap-react-node-view-draggable-item",
    ) ?? holder
  );
}

/**
 * Copies a picture drawn on a canvas into its copy, since copying a
 * canvas leaves it blank
 * @param from The block
 * @param to Its copy
 */
function copyCanvases(from: HTMLElement, to: HTMLElement) {
  const fromCanvases = from.querySelectorAll("canvas");
  const toCanvases = to.querySelectorAll("canvas");
  fromCanvases.forEach((canvas, i) => {
    toCanvases[i]?.getContext("2d")?.drawImage(canvas, 0, 0);
  });
}

/**
 * Lifts a copy of a block from the page off under the cursor, drawn at
 * the page's size on screen. It's outside the page, so it can follow the
 * cursor past the page's edge
 * @param view The editor
 * @param blockDom The block on the page
 * @param clientX Where the cursor is across the screen
 * @param clientY Where the cursor is down the screen
 */
export function showDragGhost(
  view: EditorView,
  blockDom: HTMLElement,
  clientX: number,
  clientY: number,
) {
  removeDragGhost(view);
  const ghost = blockDom.cloneNode(true) as HTMLElement;
  copyCanvases(blockDom, ghost);
  ghost.querySelector(".selected")?.classList.remove("selected");
  ghost.classList.add("block-drag-ghost", "notebook-page-text");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.setProperty("--ghost-scale", String(getPageScale(view)));
  document.body.append(ghost);
  ghosts.set(view, ghost);
  moveDragGhost(view, clientX, clientY);
}

/**
 * Keeps the ghost's middle under the cursor
 * @param view The editor
 * @param clientX Where the cursor is across the screen
 * @param clientY Where the cursor is down the screen
 */
export function moveDragGhost(
  view: EditorView,
  clientX: number,
  clientY: number,
) {
  const ghost = ghosts.get(view);
  if (!ghost) return;
  ghost.style.setProperty("--ghost-x", `${clientX}px`);
  ghost.style.setProperty("--ghost-y", `${clientY}px`);
}

export function hasDragGhost(view: EditorView): boolean {
  return ghosts.has(view);
}

export function removeDragGhost(view: EditorView) {
  ghosts.get(view)?.remove();
  ghosts.delete(view);
}

/**
 * Hands the ghost's place to the dropped block, so it settles from where
 * the ghost was, then takes the ghost away
 * @param view The editor
 * @param blockDom The dropped block
 * @returns False when there was no ghost, like for a block from the panel
 */
export function keepGhostSpotForSettle(
  view: EditorView,
  blockDom: HTMLElement,
): boolean {
  const ghost = ghosts.get(view);
  if (!ghost) return false;

  // middles of the drawn block inside each, since its holder can be a
  // different size, and the lean turns the ghost's box
  const from = readDrawnBlock(ghost).getBoundingClientRect();
  const to = readDrawnBlock(blockDom).getBoundingClientRect();
  const scale = getPageScale(view);
  const dx = (from.left + from.width / 2 - (to.left + to.width / 2)) / scale;
  const dy = (from.top + from.height / 2 - (to.top + to.height / 2)) / scale;
  view.dom.style.setProperty(SETTLE_FROM_PROPERTY, `${dx}px ${dy}px`);
  removeDragGhost(view);
  return true;
}

export function clearGhostSettle(view: EditorView) {
  view.dom.style.removeProperty(SETTLE_FROM_PROPERTY);
}
