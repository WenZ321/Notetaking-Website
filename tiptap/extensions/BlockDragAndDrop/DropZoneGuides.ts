import type { EditorView } from "@tiptap/pm/view";
import type { MeasuredRow } from "./DragUtils";
import { PAGE_EDGE_STRIP } from "./DropCases/MoveInOwnRow";

// Read by the guide lines' CSS
const GUIDES_ATTRIBUTE = "data-zone-guides";

/**
 * Shows thin lines over a block's own row at the edge strips. A block alone
 * in its row wraps to a side once its edge is past a line
 * @param view The editor
 * @param row The block's own row the cursor is in, or null to hide them
 */
export function showZoneGuides(view: EditorView, row: MeasuredRow | null) {
  const { style } = view.dom;
  if (!row) {
    view.dom.removeAttribute(GUIDES_ATTRIBUTE);
    return;
  }

  view.dom.setAttribute(GUIDES_ATTRIBUTE, "");
  style.setProperty("--zone-guides-top", `${row.top}px`);
  style.setProperty("--zone-guides-height", `${row.bottom - row.top}px`);
  style.setProperty("--zone-guides-edge", `${PAGE_EDGE_STRIP}px`);
}
