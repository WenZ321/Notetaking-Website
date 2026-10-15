import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * How many characters come between two spots, counting each inline item
 * like inline math as one. Lines breaks aren't counted, so the count stays
 * the same when moved lines are joined or split
 * @param doc The page
 * @param from Where counting starts
 * @param to Where counting stops
 * @returns The count
 */
export function getTextIndex(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): number {
  return doc.textBetween(from, to, "", "\u0000").length;
}
