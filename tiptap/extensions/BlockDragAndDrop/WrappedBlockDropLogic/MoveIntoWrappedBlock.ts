import type { EditorView } from "@tiptap/pm/view";
import type { OtherWrappedBlockDrop } from "../FindDropTarget";
import { NodeSelection } from "@tiptap/pm/state";
import { blockDragPluginKey, getDragWithBlock } from "../DragState";
import { getDroppedBlockPos } from "./GetDroppedBlockPos";
import { sumNodeSizes } from "../SumNodeSizes";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";

/**
 * Moves the dragged block into another wrapped block as one change, so one undo puts
 * it all back. The wrapped block is swapped for the saved outcome, with any text that
 * left it put above or below, and the block is selected in its new spot
 * @param view The editor
 * @param otherWrappedBlockDrop The wrapped block and the outcome saved when the target was found
 */
export function moveIntoWrappedBlock(
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

  // a drop rearranges the text, so cut-off lines no longer rejoin the line above
  makeLinesNewAfterDrop(tr, wrappedBlockStart + sumNodeSizes(above));

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
