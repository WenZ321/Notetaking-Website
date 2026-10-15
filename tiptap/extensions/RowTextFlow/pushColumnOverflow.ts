import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { findTextCut } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/findTextCut";
import { getColumnPos } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/getColumnPos";
import { measureRowBounds } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/measureRowBounds";
import { splitColumnText } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/splitColumnText";
import { ROW_FLOW_ATTR } from "./rowFlowMarker";
import { withFlowMarker } from "./withFlowMarker";
import { getNextTextSpot } from "./getNextTextSpot";
import { getTextIndex } from "./getTextIndex";
import { findPosAtTextIndex } from "./findPosAtTextIndex";
import { dispatchFlowChange } from "./dispatchFlowChange";

/**
 * Pushes the lines of a text column that reach past the row's blocks to
 * the start of the next text column, or below the row when there's none.
 * The pushed lines are marked so they can flow back, and the cursor
 * follows them if it was in them
 * @param view The editor
 * @param rowPos Where the row starts
 * @param columnIndex Which column to check
 * @returns True when lines were pushed
 */
export function pushColumnOverflow(
  view: EditorView,
  rowPos: number,
  columnIndex: number,
): boolean {
  const { state } = view;
  const row = state.doc.nodeAt(rowPos);
  const bounds = measureRowBounds(view, rowPos);
  if (!row || !bounds) return false;

  const column = row.child(columnIndex);
  const columnPos = getColumnPos(rowPos, row, columnIndex);
  const cut = findTextCut(
    view,
    columnPos,
    column,
    "first",
    bounds.top,
    bounds.bottom,
  );
  if (cut === null) return false;

  const [kept, leaving] = splitColumnText(column.content, cut);
  const isLineCut = kept.childCount + leaving.childCount > column.childCount;

  // the first pushed line rejoins the line it was cut from when it flows back
  const pushed = leaving.content.map((line, index) =>
    withFlowMarker(line, index === 0 && isLineCut ? "continues" : "whole"),
  );

  // the last pushed line is the start of a line pushed earlier, so they join
  const next = getNextTextSpot(rowPos, row, columnIndex);
  const nextLine = state.doc.nodeAt(next.pos);
  let replaceEnd = next.pos;
  if (nextLine?.attrs[ROW_FLOW_ATTR] === "continues") {
    const last = pushed[pushed.length - 1];
    pushed[pushed.length - 1] = last.copy(
      last.content.append(nextLine.content),
    );
    replaceEnd = next.pos + nextLine.nodeSize;
  }

  // where the cursor sits in the pushed text, counted in characters
  const contentStart = columnPos + 1;
  const contentEnd = columnPos + column.nodeSize - 1;
  const cutPos = contentStart + cut;
  const { selection } = state;
  const cursorIndex =
    selection.empty && selection.head >= cutPos && selection.head <= contentEnd
      ? getTextIndex(state.doc, cutPos, selection.head)
      : null;

  // a column always keeps at least one line
  const tr = state.tr;
  if (kept.size) {
    tr.delete(cutPos, contentEnd);
  } else {
    const emptyLine = state.schema.nodes.paragraph.create();
    tr.replaceWith(contentStart, contentEnd, emptyLine);
  }

  const insertAt = tr.mapping.map(next.pos);
  tr.replaceWith(insertAt, tr.mapping.map(replaceEnd), pushed);

  if (cursorIndex !== null) {
    const insertedSize = pushed.reduce((sum, line) => sum + line.nodeSize, 0);
    const pos = findPosAtTextIndex(
      tr.doc,
      insertAt,
      insertAt + insertedSize,
      cursorIndex,
    );
    tr.setSelection(TextSelection.create(tr.doc, pos));
  }

  dispatchFlowChange(view, tr);
  return true;
}
