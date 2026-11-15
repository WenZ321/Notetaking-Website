import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { ActiveDrag } from "./DragState";
import type { PagePoint } from "./DragUtils";
import type { DropTarget } from "./PageChange";
import { findRowAt } from "./DragUtils";
import { dropIntoText } from "./DropCases/DropIntoText";
import { moveAloneInOwnRow, reorderOwnRow } from "./DropCases/MoveInOwnRow";
import { joinRow } from "./DropCases/JoinRow";

/**
 * Where the dragged block lands, from the row the cursor is at the height
 * of. Rows go by the cursor, so brushing one with the ghost's edge doesn't
 * pull the block in
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
  const { origin } = drag;
  // a block from the page goes by the ghost's top edge in text, so the
  // spot sits right under the ghost. A panel block has no ghost
  const ghostTop =
    origin.kind === "page"
      ? { ...cursor, top: cursor.top - (drag.block.attrs.height as number) / 2 }
      : cursor;
  // its own row shrinks while it's hidden, so it still counts while the
  // ghost's top is in it, or a tall block would leave on the first move
  const row =
    findRowAt(drag.page, cursor.top) ??
    drag.page.rows.find(
      (row) =>
        row.isOwn && ghostTop.top >= row.top && ghostTop.top < row.bottom,
    );
  if (!row) return dropIntoText(drag, ghostTop);

  // only a block from the page has an own row
  if (row.isOwn && origin.kind === "page") {
    return row.blocks.length === 1
      ? moveAloneInOwnRow(drag, origin.startFrom, row, cursor)
      : reorderOwnRow(drag, origin.startFrom, row, cursor);
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
