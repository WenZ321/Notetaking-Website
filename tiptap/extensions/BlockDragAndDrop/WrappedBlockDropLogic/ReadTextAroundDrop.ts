import type { TextColumnNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { WrappedBlockParts } from "./ReadWrappedBlockParts";

// What text the wrapped block has around a drop on the far left or far
// right, which decides how the widths are fit. With text on both sides, the
// text on the dropped side leaves
export type TextAroundDrop =
  | { kind: "noText" }
  | { kind: "oneText"; keptText: TextColumnNode }
  | {
      kind: "twoTexts";
      keptText: TextColumnNode;
      leavingText: TextColumnNode;
    };

/**
 * Reads the text around a drop on the far left or far right of the blocks
 * @param side Where the block is dropped
 * @param parts The wrapped block's outer text columns
 * @returns Which of the three text cases the drop is
 */
export function readTextAroundDrop(
  side: "left" | "right",
  {
    textBefore,
    textAfter,
  }: Pick<WrappedBlockParts, "textBefore" | "textAfter">,
): TextAroundDrop {
  const [droppedSideText, otherSideText] =
    side === "left" ? [textBefore, textAfter] : [textAfter, textBefore];

  if (droppedSideText && otherSideText) {
    return {
      kind: "twoTexts",
      keptText: otherSideText,
      leavingText: droppedSideText,
    };
  }

  const onlyText = droppedSideText ?? otherSideText;
  if (onlyText) return { kind: "oneText", keptText: onlyText };

  return { kind: "noText" };
}
