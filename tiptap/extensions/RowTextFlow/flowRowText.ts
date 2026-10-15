import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { pushColumnOverflow } from "./pushColumnOverflow";
import { pullMarkedText } from "./pullMarkedText";

// A cap on moves for one edit, in case two rules ever keep undoing each other
const MAX_MOVES = 50;

/**
 * Moves a row's text until every text column fits the row and none has
 * room for the pushed text waiting after it. Columns are checked left to
 * right, so text pushed from the left column can carry on below the row
 * @param view The editor
 * @param rowPos Where the row starts
 */
export function flowRowText(view: EditorView, rowPos: number) {
  for (let moves = 0; moves < MAX_MOVES; moves++) {
    const row = view.state.doc.nodeAt(rowPos);
    if (row?.type.name !== "WrappedBlock") return;

    let hasMoved = false;
    for (let index = 0; index < row.childCount && !hasMoved; index++) {
      if (!isTextColumn(row.child(index))) continue;
      hasMoved =
        pushColumnOverflow(view, rowPos, index) ||
        pullMarkedText(view, rowPos, index);
    }
    if (!hasMoved) return;
  }
}
