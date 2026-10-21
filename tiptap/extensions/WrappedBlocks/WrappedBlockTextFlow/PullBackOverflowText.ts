import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { getColumnPos } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/GetColumnPos";
import { measureWrappedBlockBounds } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/MeasureWrappedBlockBounds";
import { isEmptyTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/IsEmptyTextColumn";
import { getNextTextSpot } from "./GetNextTextSpot";
import { getTextIndex } from "./GetTextIndex";
import { findPosAtTextIndex } from "./FindPosAtTextIndex";
import { dispatchFlowChange } from "./DispatchFlowChange";

// How far past the edge a line can reach and still count as fitting
const FIT_TOLERANCE = 1;

/**
 * Pulls the line after a text column back into it when the column has room
 * for at least its first line. It joins the column's last line when it isn't
 * a new line, and the cursor follows it if it was in it
 * @param view The editor
 * @param wrappedBlockPos Where the wrapped block starts
 * @param columnIndex Which column to fill
 * @returns True when a line was pulled back
 */
export function pullBackOverflowText(
  view: EditorView,
  wrappedBlockPos: number,
  columnIndex: number,
): boolean {
  const { state } = view;
  const wrappedBlock = state.doc.nodeAt(wrappedBlockPos);
  const bounds = measureWrappedBlockBounds(view, wrappedBlockPos);
  if (!wrappedBlock || !bounds) return false;

  const next = getNextTextSpot(wrappedBlockPos, wrappedBlock, columnIndex);
  const line = state.doc.nodeAt(next.pos);
  if (!line || !line.isTextblock) return false;

  // room for at least the waiting line's first line of text
  const column = wrappedBlock.child(columnIndex);
  const columnPos = getColumnPos(wrappedBlockPos, wrappedBlock, columnIndex);
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
  let insertAt: number;
  if (line.attrs.isNewLine === false || isColumnEmpty) {
    insertAt = contentEnd - 1;
    tr.insert(insertAt, line.content);
  } else {
    insertAt = contentEnd;
    tr.insert(insertAt, line);
  }

  if (cursorIndex !== null) {
    const pos = findPosAtTextIndex(
      tr.doc,
      insertAt,
      insertAt + line.nodeSize,
      cursorIndex,
    );
    tr.setSelection(TextSelection.create(tr.doc, pos));
  }

  dispatchFlowChange(view, tr);
  return true;
}
