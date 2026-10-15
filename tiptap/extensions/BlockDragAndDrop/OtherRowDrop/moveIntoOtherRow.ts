import type { EditorView } from "@tiptap/pm/view";
import type { RowDrop } from "../findDropTarget";
import { NodeSelection } from "@tiptap/pm/state";
import { blockDragPluginKey, getDraggedBlock } from "../dragState";
import { getDroppedBlockPos } from "./getDroppedBlockPos";
import { clearFlowMarkers } from "@/tiptap/extensions/RowTextFlow/clearFlowMarkers";

/**
 * Moves the dragged block into another row as one change, so one undo puts
 * it all back. The row is swapped for the saved result, with any text that
 * left it put above or below, and the block is selected in its new spot
 * @param view The editor
 * @param rowDrop The row and the result saved when the target was found
 */
export function moveIntoOtherRow(view: EditorView, rowDrop: RowDrop) {
  const dragged = getDraggedBlock(view.state);
  const rowNode = view.state.doc.nodeAt(rowDrop.rowStart);
  if (!dragged || !rowNode) return;

  const { above, row, below } = rowDrop.result;
  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(dragged.from, dragged.to);

  const rowStart = tr.mapping.map(rowDrop.rowStart);
  tr.replaceWith(rowStart, rowStart + rowNode.nodeSize, [
    ...above,
    row,
    ...below,
  ]);

  // a drop is a one-time move, so text pushed out of the row earlier stays put
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  clearFlowMarkers(tr, rowStart + aboveSize);

  const blockPos = getDroppedBlockPos(rowStart, rowDrop.result);
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);

  // The row was built to follow the row rules, so the layout plugin should
  // leave it alone. If it rebuilt it, the drop rules and row rules disagree
  if (process.env.NODE_ENV === "development") {
    let isKept = false;
    view.state.doc.forEach((node) => {
      if (node === row) isKept = true;
    });
    if (!isKept) {
      console.warn("The row rules changed a row built by a drop", row.toJSON());
    }
  }
}
