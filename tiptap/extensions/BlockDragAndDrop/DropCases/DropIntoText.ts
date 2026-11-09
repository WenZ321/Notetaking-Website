import type { ActiveDrag } from "../DragState";
import type { PagePoint } from "../DragUtils";
import type { DropTarget } from "../PageChange";
import { getBlockPosInColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { findLineAt } from "../DragUtils";
import {
  getWrapAtCursor,
  makeNewspaperColumns,
  moveAloneInOwnRow,
} from "./MoveInOwnRow";

/**
 * Drops the block into the text as its own row. It goes above the line
 * under the cursor, or below it when the cursor is on the line's bottom half.
 * In the gap above a row, it goes above that row. Across the page, it wraps
 * the same as a block moved in its own row, and one too wide for a newspaper
 * wraps to the side the cursor is nearer
 * @param drag The drag
 * @param cursor The cursor on the page
 * @returns The target, or null when the page has no lines
 */
export function dropIntoText(
  drag: ActiveDrag,
  cursor: PagePoint,
): DropTarget | null {
  const line = findLineAt(drag.page, cursor.top);
  if (!line) return null;

  // in the gap above a row, the next line down is under that row, so the
  // block goes right above the row instead
  const rowBelow = drag.page.rows.find((row) => cursor.top < row.top);
  const isAboveRow = !!rowBelow && rowBelow.start < line.start;

  const isOnTopHalf = cursor.top < (line.top + line.bottom) / 2;
  const linePos = isOnTopHalf ? line.start : line.end;
  const pos = isAboveRow ? rowBelow.start : linePos;

  const { doc, schema } = drag.startState;

  // right beside a row that's only this block, it would land where it is,
  // so it acts like a move in that row, which can still change its wrap.
  // A newspaper's text columns count, so its block can still leave
  const { origin } = drag;
  const ownRow = drag.page.rows.find((row) => row.isOwn);
  const isAloneInOwnRow =
    !!ownRow && doc.nodeAt(ownRow.start)!.childCount === 1;
  if (
    origin.kind === "page" &&
    isAloneInOwnRow &&
    (pos === ownRow.start || pos === ownRow.end)
  ) {
    return moveAloneInOwnRow(drag, origin.startFrom, ownRow, cursor);
  }

  const nearerSide = cursor.left < drag.page.width / 2 ? "left" : "right";
  const { wrap, leftTextWidth } = getWrapAtCursor(drag, cursor) ?? {
    wrap: nearerSide,
    leftTextWidth: null,
  };

  const blockColumn = schema.nodes.WrappedColumn.create(
    { columnType: "block" },
    drag.block,
  );
  const columns =
    wrap === "newspaper"
      ? makeNewspaperColumns(schema, blockColumn, leftTextWidth)
      : [blockColumn];
  const row = schema.nodes.WrappedBlock.create({ wrap }, columns);

  // a row is always followed by a line of text, like the layout rules add
  const isTextNext = !!doc.resolve(pos).nodeAfter?.isTextblock;
  const nodes = isTextNext ? [row] : [row, schema.nodes.paragraph.create()];

  return {
    name: `text ${pos} ${wrap} ${leftTextWidth}`,
    change: {
      start: pos,
      end: pos,
      nodes,
      blockOffset: getBlockPosInColumn(
        0,
        columns,
        columns.indexOf(blockColumn),
      ),
      includesOriginal: false,
    },
  };
}
