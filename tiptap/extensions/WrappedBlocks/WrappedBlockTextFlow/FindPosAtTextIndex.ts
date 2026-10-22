import type { PageNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { getTextIndex } from "./GetTextIndex";

/**
 * Finds the first spot inside a line of text that comes a given number of
 * characters after a start, used to put the cursor back on moved text
 * @param doc The page
 * @param from Where counting starts
 * @param to The last spot to look at
 * @param index How many characters in
 * @returns The spot, or the last spot inside a line when the count runs out
 */
export function findPosAtTextIndex(
  doc: PageNode,
  from: number,
  to: number,
  index: number,
): number {
  let lastInLine = from;
  for (let pos = from; pos <= to; pos++) {
    if (!doc.resolve(pos).parent.isTextblock) continue;
    lastInLine = pos;
    if (getTextIndex(doc, from, pos) >= index) return pos;
  }
  return lastInLine;
}
