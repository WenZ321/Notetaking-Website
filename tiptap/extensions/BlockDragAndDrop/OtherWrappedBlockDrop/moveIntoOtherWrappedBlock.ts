import type { EditorView } from "@tiptap/pm/view";
import type { WrappedBlockDrop } from "../findDropTarget";
import { NodeSelection } from "@tiptap/pm/state";
import { blockDragPluginKey, getDraggedBlock } from "../dragState";
import { getDroppedBlockPos } from "./getDroppedBlockPos";
import { clearFlowMarkers } from "@/tiptap/extensions/WrappedBlockTextFlow/clearFlowMarkers";

/**
 * Moves the dragged block into another wrapped block as one change, so one undo puts
 * it all back. The wrapped block is swapped for the saved result, with any text that
 * left it put above or below, and the block is selected in its new spot
 * @param view The editor
 * @param wrappedBlockDrop The wrapped block and the result saved when the target was found
 */
export function moveIntoOtherWrappedBlock(
  view: EditorView,
  wrappedBlockDrop: WrappedBlockDrop,
) {
  const dragged = getDraggedBlock(view.state);
  const oldWrappedBlock = view.state.doc.nodeAt(
    wrappedBlockDrop.wrappedBlockStart,
  );
  if (!dragged || !oldWrappedBlock) return;

  const {
    above,
    wrappedBlock: newWrappedBlock,
    below,
  } = wrappedBlockDrop.result;
  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(dragged.from, dragged.to);

  const wrappedBlockStart = tr.mapping.map(wrappedBlockDrop.wrappedBlockStart);
  tr.replaceWith(
    wrappedBlockStart,
    wrappedBlockStart + oldWrappedBlock.nodeSize,
    [...above, newWrappedBlock, ...below],
  );

  // a drop is a one-time move, so text pushed out of the wrapped block earlier stays put
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  clearFlowMarkers(tr, wrappedBlockStart + aboveSize);

  const blockPos = getDroppedBlockPos(
    wrappedBlockStart,
    wrappedBlockDrop.result,
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
