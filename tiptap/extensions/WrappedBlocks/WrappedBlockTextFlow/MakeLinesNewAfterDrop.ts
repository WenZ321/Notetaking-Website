import type { Transaction } from "@tiptap/pm/state";

/**
 * Makes every line in a wrapped block, and the line right after it, a new line.
 * Used when a drop rebuilds the wrapped block, since a cut-off line may no
 * longer sit right after the line it was cut from
 * @param tr The change that rebuilt the wrapped block
 * @param wrappedBlockPos Where the wrapped block starts in the changed page
 */
export function makeLinesNewAfterDrop(
  tr: Transaction,
  wrappedBlockPos: number,
) {
  const wrappedBlock = tr.doc.nodeAt(wrappedBlockPos);
  if (!wrappedBlock) return;

  const wrappedBlockEnd = wrappedBlockPos + wrappedBlock.nodeSize;
  tr.doc.nodesBetween(wrappedBlockPos, wrappedBlockEnd, (node, pos) => {
    if (node.attrs.isNewLine === false)
      tr.setNodeAttribute(pos, "isNewLine", true);
  });

  // a cut-off line pushed out of the wrapped block waits right after it
  const lineAfter = tr.doc.nodeAt(wrappedBlockEnd);
  if (lineAfter?.attrs.isNewLine === false)
    tr.setNodeAttribute(wrappedBlockEnd, "isNewLine", true);
}
