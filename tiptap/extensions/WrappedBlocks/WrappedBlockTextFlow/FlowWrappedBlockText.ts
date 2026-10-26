import type { EditorView } from "@tiptap/pm/view";
import { pushOverflowText } from "./PushOverflowText";

// A cap on moves for one edit, in case a push ever keeps finding more to move
const MAX_MOVES = 50;

/**
 * Pushes a newspaper's text down until both text columns fit beside its
 * blocks. Text never flows back up. Rows wrapped left or right hold no
 * text, so there's nothing to move
 * @param view The editor
 * @param rowPos Where the row starts
 */
export function flowWrappedBlockText(view: EditorView, rowPos: number) {
  for (let moves = 0; moves < MAX_MOVES; moves++) {
    const row = view.state.doc.nodeAt(rowPos);
    if (row?.type.name !== "WrappedBlock") return;
    if (row.attrs.wrap !== "newspaper") return;

    // a newspaper's left text is its first column and its right text its last
    const rowEnd = rowPos + row.nodeSize;
    const leftTextPos = rowPos + 1;
    const rightTextPos = rowEnd - 1 - row.lastChild!.nodeSize;

    // the left text's extra lines go to the start of the right text, and the
    // right text's go just below the row. One push at a time, left first
    const hasMoved =
      pushOverflowText(view, rowPos, leftTextPos, rightTextPos + 1) ||
      pushOverflowText(view, rowPos, rightTextPos, rowEnd);
    if (!hasMoved) return;
  }
}
