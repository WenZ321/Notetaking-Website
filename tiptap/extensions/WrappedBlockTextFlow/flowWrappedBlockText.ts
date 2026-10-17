import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { pushColumnOverflow } from "./pushColumnOverflow";
import { pullMarkedText } from "./pullMarkedText";

// A cap on moves for one edit, in case two rules ever keep undoing each other
const MAX_MOVES = 50;

/**
 * Moves a wrapped block's text until every text column fits the wrapped block and none has
 * room for the pushed text waiting after it. Columns are checked left to
 * right, so text pushed from the left column can carry on below the wrapped block
 * @param view The editor
 * @param wrappedBlockPos Where the wrapped block starts
 */
export function flowWrappedBlockText(
  view: EditorView,
  wrappedBlockPos: number,
) {
  for (let moves = 0; moves < MAX_MOVES; moves++) {
    const wrappedBlock = view.state.doc.nodeAt(wrappedBlockPos);
    if (wrappedBlock?.type.name !== "WrappedBlock") return;

    let hasMoved = false;
    for (let index = 0; index < wrappedBlock.childCount && !hasMoved; index++) {
      if (!isTextColumn(wrappedBlock.child(index))) continue;
      hasMoved =
        pushColumnOverflow(view, wrappedBlockPos, index) ||
        pullMarkedText(view, wrappedBlockPos, index);
    }
    if (!hasMoved) return;
  }
}
