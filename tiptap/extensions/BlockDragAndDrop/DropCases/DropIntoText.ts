import type { ActiveDrag } from "../DragState";
import type { PagePoint } from "../DragUtils";
import type { DropTarget } from "../PageChange";
import { getBlockPosInColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { findLineAt, getLeavingRange } from "../DragUtils";
import {
  getWrapAtCursor,
  makeNewspaperColumns,
  moveAloneInOwnRow,
} from "./MoveInOwnRow";

/**
 * Where the empty lines right under a spot stop, once they're as tall as a
 * block, so a block dropped there takes their place instead of pushing the
 * page down
 * @param drag The drag
 * @param pos The spot
 * @param height How tall the block is
 * @returns Where the covered empty lines end, or the spot when there are none
 */
function findEmptyLinesEnd(
  drag: ActiveDrag,
  pos: number,
  height: number,
): number {
  const { doc } = drag.startState;
  const { origin } = drag;
  // the block's old row leaves, so the empty lines on both sides of it join
  const leaving =
    origin.kind === "page" ? getLeavingRange(doc, origin.startFrom) : null;
  let end = pos;
  let covered = 0;
  for (const line of drag.page.lines) {
    if (end === leaving?.from) end = leaving.to;
    if (line.start < end) continue;
    const node = doc.nodeAt(line.start)!;
    const isEmptyLine =
      node.type.name === "paragraph" && node.content.size === 0;
    if (line.start !== end || !isEmptyLine || covered >= height) break;
    end = line.end;
    covered += line.bottom - line.top;
  }
  return end;
}

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

  // lines under a newspaper stack below it, so it takes the place of the
  // empty lines it covers. Lines beside a floated row already make room.
  // The line a row needs under it is added by the row rules
  const end =
    wrap === "newspaper"
      ? findEmptyLinesEnd(drag, pos, drag.block.attrs.height as number)
      : pos;
  // covering lines past its old row swaps that row too, so the block
  // moves along instead of being removed
  const includesOriginal =
    origin.kind === "page" && pos < origin.startFrom && origin.startFrom < end;
  return {
    name: `text ${pos} ${wrap} ${leftTextWidth}`,
    change: {
      start: pos,
      end,
      nodes: [row],
      blockOffset: getBlockPosInColumn(
        0,
        columns,
        columns.indexOf(blockColumn),
      ),
      includesOriginal,
    },
  };
}
