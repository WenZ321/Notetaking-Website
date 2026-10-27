import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { findTextCut } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/FindTextCut";
import { measureWrappedBlockBounds } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/MeasureWrappedBlockBounds";
import { splitColumnText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/SplitColumnText";
import { sumNodeSizes } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { getTextIndex } from "./GetTextIndex";
import { findPosAtTextIndex } from "./FindPosAtTextIndex";
import { dispatchChange } from "@/tiptap/TransactionBehavior";
import { WRAPPED_BLOCK_FLOW_META } from "./WrappedBlockTextFlowPlugin";

/**
 * Pushes the lines of a text column that reach past the row's blocks to
 * another spot. A line cut in half is marked as not a new line after the
 * cut, and the cursor follows the pushed lines if it was in them
 * @param view The editor
 * @param rowPos Where the row starts
 * @param columnPos Where the text column starts
 * @param nextPos Where its extra lines go
 * @returns True when lines were pushed
 */
export function pushOverflowText(
  view: EditorView,
  rowPos: number,
  columnPos: number,
  nextPos: number,
): boolean {
  const { state } = view;
  const column = state.doc.nodeAt(columnPos);
  const bounds = measureWrappedBlockBounds(view, rowPos);
  if (!column || !bounds) return false;

  // a column that's just one empty line has nothing to push
  const isOneEmptyLine =
    column.childCount === 1 && column.firstChild!.content.size === 0;
  if (isOneEmptyLine) return false;

  const cut = findTextCut(view, columnPos, column, bounds.bottom);
  if (cut === null) return false;

  const [kept, leaving] = splitColumnText(column.content, cut);
  const isLineCut = kept.childCount + leaving.childCount > column.childCount;

  // a line cut in half isn't a new line after the cut, so a later push can
  // join it back onto the rest of that line
  const pushed = [...leaving.content];
  if (isLineCut) {
    const cutOff = pushed[0];
    pushed[0] = cutOff.type.create(
      { ...cutOff.attrs, isNewLine: false },
      cutOff.content,
      cutOff.marks,
    );
  }

  // the waiting line was cut off from the last pushed line, so they join
  const nextLine = state.doc.nodeAt(nextPos);
  let replaceEnd = nextPos;
  if (nextLine?.attrs.isNewLine === false) {
    const last = pushed[pushed.length - 1];
    pushed[pushed.length - 1] = last.copy(
      last.content.append(nextLine.content),
    );
    replaceEnd = nextPos + nextLine.nodeSize;
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

  const insertAt = tr.mapping.map(nextPos);
  tr.replaceWith(insertAt, tr.mapping.map(replaceEnd), pushed);

  if (cursorIndex !== null) {
    const pos = findPosAtTextIndex(
      tr.doc,
      insertAt,
      insertAt + sumNodeSizes(pushed),
      cursorIndex,
    );
    tr.setSelection(TextSelection.create(tr.doc, pos));
  }

  // undone together with the edit that made the text move
  dispatchChange(
    view,
    tr.setMeta(WRAPPED_BLOCK_FLOW_META, true),
    "joinLastStep",
  );
  return true;
}
