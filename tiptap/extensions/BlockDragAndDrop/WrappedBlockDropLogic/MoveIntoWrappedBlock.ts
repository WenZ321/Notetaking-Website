import type { EditorView } from "@tiptap/pm/view";
import type { OtherWrappedBlockDrop } from "../FindDropTarget";
import { NodeSelection } from "@tiptap/pm/state";
import { blockDragPluginKey, getDragWithBlock } from "../DragState";
import { getDroppedBlockPos } from "./GetDroppedBlockPos";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

/**
 * Moves the dragged block into another wrapped block as one change, so one undo puts
 * it all back. The wrapped block is swapped for the saved outcome, and the block is
 * selected in its new spot. A newspaper's text that no longer fits is pushed down
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

  const newWrappedBlock = otherWrappedBlockDrop.outcome.wrappedBlock;
  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(dragged.from, dragged.to);

  const wrappedBlockStart = tr.mapping.map(
    otherWrappedBlockDrop.wrappedBlockStart,
  );
  tr.replaceWith(
    wrappedBlockStart,
    wrappedBlockStart + oldWrappedBlock.nodeSize,
    newWrappedBlock,
  );

  // a drop rearranges the text, so cut-off lines no longer rejoin the line above
  makeLinesNewAfterDrop(tr, wrappedBlockStart);

  const blockPos = getDroppedBlockPos(
    wrappedBlockStart,
    otherWrappedBlockDrop.outcome,
  );
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  dispatchChange(view, tr, "ownStep");

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

  // a newspaper's text that no longer fits is pushed down. It runs after
  // the check above, since pushing text changes the wrapped block
  flowWrappedBlockText(view, wrappedBlockStart);
}
