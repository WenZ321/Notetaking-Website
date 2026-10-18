import type { TextColumnNode } from "@/tiptap/nodes/wrappedNodeTypes";
import type { WrappedBlockParts } from "./readWrappedBlockParts";

/**
 * Which text column stays when a block is dropped on the far left or far
 * right of the blocks. With text on both sides, the text on the dropped side
 * leaves. A single text column stays
 * @param side Where the block is dropped
 * @param parts The wrapped block's outer text columns
 * @returns The text column that stays, or null when there's no text
 */
export function pickKeptText(
  side: "left" | "right",
  {
    textBefore,
    textAfter,
  }: Pick<WrappedBlockParts, "textBefore" | "textAfter">,
): TextColumnNode | null {
  const [droppedSideText, otherSideText] =
    side === "left" ? [textBefore, textAfter] : [textAfter, textBefore];
  return otherSideText ?? droppedSideText;
}
