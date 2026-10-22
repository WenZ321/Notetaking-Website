import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { pushOverflowText } from "./PushOverflowText";

// A cap on moves for one edit, in case a push ever keeps finding more to move
const MAX_MOVES = 50;

/**
 * Pushes a newspaper's text down until every text column fits beside its
 * blocks. The left column is checked first, so its extra lines go to the
 * right column, and the right column's extra lines go under the blocks.
 * Text never flows back up. Left and right wrapped blocks hold no text, so
 * there's nothing to move
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
    if (wrappedBlock.attrs.wrap !== "newspaper") return;

    let hasMoved = false;
    for (let index = 0; index < wrappedBlock.childCount && !hasMoved; index++) {
      if (!isTextColumn(wrappedBlock.child(index))) continue;
      hasMoved = pushOverflowText(view, wrappedBlockPos, index);
    }
    if (!hasMoved) return;
  }
}
