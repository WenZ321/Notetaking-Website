import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { ActiveDrag } from "./DragState";
import type { PagePoint } from "./DragUtils";
import type { DropTarget } from "./PageChange";
import { findRowAt } from "./DragUtils";
import { dropIntoText } from "./DropCases/DropIntoText";
import { moveAloneInOwnRow, reorderOwnRow } from "./DropCases/MoveInOwnRow";
import { joinRow } from "./DropCases/JoinRow";

/**
 * Where the dragged block lands, from the row the cursor is at the height of
 * @param drag The drag
 * @param cursor The cursor on the page
 * @param snapBlockSide How the page's paper fits block sizes
 * @returns The target, or null when there's nowhere to drop
 */
export function findDrop(
  drag: ActiveDrag,
  cursor: PagePoint,
  snapBlockSide: SnapBlockSide,
): DropTarget | null {
  const row = findRowAt(drag.page, cursor.top);
  if (!row) return dropIntoText(drag, cursor);

  if (row.isOwn) {
    return row.blocks.length === 1
      ? moveAloneInOwnRow(drag, row, cursor)
      : reorderOwnRow(drag, row, cursor);
  }

  switch (row.wrap) {
    case "left":
    case "right":
      return joinRow(drag, row, cursor, row.wrap, snapBlockSide);

    // a newspaper wraps to the side of its blocks the cursor is on, the
    // same as inserting a block into its text on that side
    case "newspaper": {
      const blocksMiddle = (row.blocks[0].left + row.blocks.at(-1)!.right) / 2;
      const side = cursor.left < blocksMiddle ? "left" : "right";
      return joinRow(drag, row, cursor, side, snapBlockSide);
    }
  }
}
