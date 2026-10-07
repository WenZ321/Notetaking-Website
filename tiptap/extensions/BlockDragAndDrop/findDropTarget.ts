import type { EditorView } from "@tiptap/pm/view";
import type { Slice } from "@tiptap/pm/model";
import { dropPoint } from "@tiptap/pm/transform";

// Where a dragged block will land. The drag saves it, and both the preview
// and the drop read that saved one, so the block lands where the preview showed
export type DropTarget = {
  // where the block goes, in the page before the original is removed
  pos: number;
  // the block's top left corner in the window, for the preview
  left: number;
  top: number;
};

/**
 * Decides where a dragged block lands, for now the spot in the document
 * the editor finds under the cursor
 * @param view The editor
 * @param event The drag event, for the cursor position
 * @param slice What's being dragged
 * @returns The target, or null when there's no place to drop
 */
export function findDropTarget(
  view: EditorView,
  event: DragEvent,
  slice: Slice,
): DropTarget | null {
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!found) return null;

  const pos = dropPoint(view.state.doc, found.pos, slice) ?? found.pos;
  const spot = view.coordsAtPos(pos);

  return { pos, left: spot.left, top: spot.top };
}
