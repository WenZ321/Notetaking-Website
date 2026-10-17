import type { EditorView } from "@tiptap/pm/view";
import type { OtherWrappedBlockDrop } from "../findDropTarget";
import { NodeSelection } from "@tiptap/pm/state";
import { blockDragPluginKey, getDragWithBlock } from "../dragState";
import { getDroppedBlockPos } from "./getDroppedBlockPos";
import { clearFlowMarkersAfterDrop } from "@/tiptap/extensions/WrappedBlockTextFlow/clearFlowMarkersAfterDrop";

/**
 * Moves the dragged block into another wrapped block as one change, so one undo puts
 * it all back. The wrapped block is swapped for the saved outcome, with any text that
 * left it put above or below, and the block is selected in its new spot
 * @param view The editor
 * @param otherWrappedBlockDrop The wrapped block and the outcome saved when the target was found
 */
export function moveIntoOtherWrappedBlock(
  view: EditorView,
  otherWrappedBlockDrop: OtherWrappedBlockDrop,
) {
  const dragged = getDragWithBlock(view.state);
  const oldWrappedBlock = view.state.doc.nodeAt(
    otherWrappedBlockDrop.wrappedBlockStart,
  );
  if (!dragged || !oldWrappedBlock) return;

  const {
    above,
    wrappedBlock: newWrappedBlock,
    below,
  } = otherWrappedBlockDrop.outcome;
  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(dragged.from, dragged.to);

  const wrappedBlockStart = tr.mapping.map(
    otherWrappedBlockDrop.wrappedBlockStart,
  );
  tr.replaceWith(
    wrappedBlockStart,
    wrappedBlockStart + oldWrappedBlock.nodeSize,
    [...above, newWrappedBlock, ...below],
  );

  // a drop is a one-time move, so text pushed out of the wrapped block earlier stays put
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  clearFlowMarkersAfterDrop(tr, wrappedBlockStart + aboveSize);

  const blockPos = getDroppedBlockPos(
    wrappedBlockStart,
    otherWrappedBlockDrop.outcome,
  );
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);

  // The wrapped block was built to follow the wrapped block rules, so the layout plugin should
  // leave it alone. If it rebuilt it, the drop rules and wrapped block rules disagree
  if (process.env.NODE_ENV === "development") {
    let isKept = false;
    view.state.doc.forEach((node) => {
      if (node === newWrappedBlock) isKept = true;
    });
    if (!isKept) {
      console.warn(
        "The wrapped block rules changed a wrapped block built by a drop",
        newWrappedBlock.toJSON(),
      );
    }
  }
}
