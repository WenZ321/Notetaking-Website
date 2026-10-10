import type { LengthLimits } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { BlockRow } from "./getBlockRow";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

// How wide a side handle can make the block, and whether shrinking leaves
// an empty gap on that side that becomes a text column on release
export type SideResizeLimits = LengthLimits & { opensGap: boolean };

// When the dragged edge can't move on its own, the block can't grow that
// way. It can only shrink by leaving a gap, and only when it's the row's
// one block, since other rows have no room for another column
function limitsForFixedEdge(
  row: BlockRow,
  startWidth: number,
  limits: LengthLimits,
): SideResizeLimits {
  if (row.blockCount > 1) {
    return { min: startWidth, max: startWidth, opensGap: false };
  }
  return { min: limits.min, max: startWidth, opensGap: true };
}

/**
 * Limits for resizing with the left or right handle so the block's other
 * edge stays where it is
 * @param side The handle being dragged
 * @param row What's around the block in its row
 * @param startWidth The block's width when the resize started
 * @param limits The block's own smallest and largest width
 * @returns The width limits, and whether shrinking opens a gap
 */
export function getSideResizeLimits(
  side: "left" | "right",
  row: BlockRow | null,
  startWidth: number,
  limits: LengthLimits,
): SideResizeLimits {
  if (!row) return { ...limits, opensGap: false };

  const { leftText } = row;
  const room = NOTEBOOK_PAGE_WIDTH - row.otherBlocksWidth;

  if (side === "left") {
    // nothing before the block can give way, so its left edge is fixed
    if (!row.hasTextBefore) return limitsForFixedEdge(row, startWidth, limits);

    // text right before the block gives up its width, otherwise the block
    // can take whatever the other blocks leave
    const max = leftText ? startWidth + leftText.width : room;
    return { min: limits.min, max: Math.min(limits.max, max), opensGap: false };
  }

  // text before the block but none after pins it to the row's right end
  if (row.hasTextBefore && !row.hasTextAfter) {
    return limitsForFixedEdge(row, startWidth, limits);
  }

  const max = leftText ? NOTEBOOK_PAGE_WIDTH - leftText.width : room;
  return { min: limits.min, max: Math.min(limits.max, max), opensGap: false };
}
