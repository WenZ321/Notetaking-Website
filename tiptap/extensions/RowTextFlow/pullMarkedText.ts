import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { getColumnPos } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/getColumnPos";
import { measureRowBounds } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/measureRowBounds";
import { isEmptyTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/isEmptyTextColumn";
import { ROW_FLOW_ATTR } from "./rowFlowMarker";
import { withFlowMarker } from "./withFlowMarker";
import { getNextTextSpot } from "./getNextTextSpot";
import { getTextIndex } from "./getTextIndex";
import { findPosAtTextIndex } from "./findPosAtTextIndex";
import { dispatchFlowChange } from "./dispatchFlowChange";

// How far past the edge a line can reach and still count as fitting
const FIT_TOLERANCE = 1;

/**
 * Pulls one pushed line back into a text column when the column has room
 * for at least its first line. Only a marked line right where the column's
 * extra lines go can come back. It joins the column's last line when it
 * was cut from it, and the cursor follows it if it was in it
 * @param view The editor
 * @param rowPos Where the row starts
 * @param columnIndex Which column to fill
 * @returns True when a line was pulled back
 */
export function pullMarkedText(
  view: EditorView,
  rowPos: number,
  columnIndex: number,
): boolean {
  const { state } = view;
  const row = state.doc.nodeAt(rowPos);
  const bounds = measureRowBounds(view, rowPos);
  if (!row || !bounds) return false;

  const next = getNextTextSpot(rowPos, row, columnIndex);
  const line = state.doc.nodeAt(next.pos);
  const marker = line?.attrs[ROW_FLOW_ATTR];
  if (!line || !line.isTextblock || !marker) return false;

  // room for at least the waiting line's first line of text
  const column = row.child(columnIndex);
  const columnPos = getColumnPos(rowPos, row, columnIndex);
  const contentEnd = columnPos + column.nodeSize - 1;
  const isColumnEmpty = isEmptyTextColumn(column);
  const textBottom = isColumnEmpty
    ? bounds.top
    : view.coordsAtPos(contentEnd - 1, -1).bottom;
  const firstLine = view.coordsAtPos(next.pos + 1, 1);
  const lineHeight = firstLine.bottom - firstLine.top;
  if (textBottom + lineHeight > bounds.bottom + FIT_TOLERANCE) return false;

  const { selection } = state;
  const lineEnd = next.pos + line.nodeSize;
  const cursorIndex =
    selection.empty && selection.head > next.pos && selection.head < lineEnd
      ? getTextIndex(state.doc, next.pos, selection.head)
      : null;

  // the waiting line leaves its spot, and a column it empties keeps one line
  const tr = state.tr;
  const leavesColumnEmpty = next.column?.childCount === 1;
  if (leavesColumnEmpty) {
    tr.replaceWith(next.pos, lineEnd, state.schema.nodes.paragraph.create());
  } else {
    tr.delete(next.pos, lineEnd);
  }

  // joins the column's last line, or comes back as its own line. An empty
  // column's one line is filled instead
  const returning = withFlowMarker(line, null);
  let insertAt: number;
  if (marker === "continues" || isColumnEmpty) {
    insertAt = contentEnd - 1;
    tr.insert(insertAt, returning.content);
  } else {
    insertAt = contentEnd;
    tr.insert(insertAt, returning);
  }

  if (cursorIndex !== null) {
    const pos = findPosAtTextIndex(
      tr.doc,
      insertAt,
      insertAt + returning.nodeSize,
      cursorIndex,
    );
    tr.setSelection(TextSelection.create(tr.doc, pos));
  }

  dispatchFlowChange(view, tr);
  return true;
}
