import type { Transaction } from "@tiptap/pm/state";
import { ROW_FLOW_ATTR } from "./rowFlowMarker";

/**
 * Clears the flow markers in a row and in the pushed lines right after it.
 * Used when a drop rebuilds the row, since a drop is a one-time move and
 * the old pushed text shouldn't flow into the new layout
 * @param tr The change that rebuilt the row
 * @param rowPos Where the row starts in the changed page
 */
export function clearFlowMarkers(tr: Transaction, rowPos: number) {
  const row = tr.doc.nodeAt(rowPos);
  if (!row) return;

  const rowEnd = rowPos + row.nodeSize;
  tr.doc.nodesBetween(rowPos, rowEnd, (node, pos) => {
    if (node.attrs[ROW_FLOW_ATTR]) tr.setNodeAttribute(pos, ROW_FLOW_ATTR, null);
  });

  // the pushed lines wait right after the row, one after another
  let pos = rowEnd;
  let line = tr.doc.nodeAt(pos);
  while (line?.attrs[ROW_FLOW_ATTR]) {
    tr.setNodeAttribute(pos, ROW_FLOW_ATTR, null);
    pos += line.nodeSize;
    line = tr.doc.nodeAt(pos);
  }
}
