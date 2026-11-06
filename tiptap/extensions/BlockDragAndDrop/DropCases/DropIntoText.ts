import type { ActiveDrag } from "../DragState";
import type { PagePoint } from "../DragUtils";
import type { DropTarget } from "../PageChange";
import { DEFAULT_WRAP } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import { getBlockPosInColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { findLineAt } from "../DragUtils";
import { HOME_TARGET } from "../PageChange";

/**
 * Drops the block into the text as its own row. It goes above the line
 * under the cursor, or below it when the cursor is on the line's bottom half.
 * In the gap above a row, it goes above that row
 * @param drag The drag
 * @param cursor The cursor on the page
 * @returns The target, home when that spot is right beside the block's own
 * row with nothing else in it, or null when the page has no lines
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

  // right beside a row that's only this block, it would land where it is.
  // A newspaper's text columns count, so its block can still leave
  const ownRow = drag.page.rows.find((row) => row.isOwn);
  const isAloneInOwnRow =
    !!ownRow && doc.nodeAt(ownRow.start)!.childCount === 1;
  if (isAloneInOwnRow && (pos === ownRow.start || pos === ownRow.end)) {
    return HOME_TARGET;
  }

  const column = schema.nodes.WrappedColumn.create(
    { columnType: "block" },
    drag.block,
  );
  const row = schema.nodes.WrappedBlock.create({ wrap: DEFAULT_WRAP }, column);

  // a row is always followed by a line of text, like the layout rules add
  const isTextNext = !!doc.resolve(pos).nodeAfter?.isTextblock;
  const nodes = isTextNext ? [row] : [row, schema.nodes.paragraph.create()];

  return {
    name: `text ${pos}`,
    change: {
      start: pos,
      end: pos,
      nodes,
      blockOffset: getBlockPosInColumn(0, [column], 0),
      includesOriginal: false,
    },
  };
}
