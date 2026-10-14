import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

// How far past the edge a line can reach and still count as fitting, so
// tiny rounding differences don't move a line
const FIT_TOLERANCE = 1;

/**
 * Finds where a text column has to be cut so it fits the row's height, by
 * looking at where each spot in its text sits on the page. Keeping the
 * first lines cuts before the first line that reaches past the row's
 * bottom. Keeping the last lines cuts before the first line low enough
 * that everything from it on fits in the row
 * @param view The editor
 * @param columnPos Where the column starts
 * @param column The column
 * @param keep Which lines stay in the row
 * @param rowTop The row's top edge, in the window
 * @param rowBottom The row's bottom edge, in the window
 * @returns The spot to cut at, counted from the start of the column's
 * lines, or null when the text already fits
 */
export function findTextCut(
  view: EditorView,
  columnPos: number,
  column: ProseMirrorNode,
  keep: "first" | "last",
  rowTop: number,
  rowBottom: number,
): number | null {
  // every spot inside the column's lines, top to bottom
  const contentStart = columnPos + 1;
  const spots: number[] = [];
  column.forEach((line, offset) => {
    if (!line.isTextblock) return;
    const lineStart = contentStart + offset + 1;
    for (let i = 0; i <= line.content.size; i++) spots.push(lineStart + i);
  });
  if (!spots.length) return null;

  // the spot's caret, on the start of the next line where a line wraps
  const caret = (spot: number) => view.coordsAtPos(spot, 1);

  const textBottom = caret(spots[spots.length - 1]).bottom;
  const isCut =
    keep === "first"
      ? (spot: number) => caret(spot).bottom > rowBottom + FIT_TOLERANCE
      : (spot: number) =>
          caret(spot).top >=
          textBottom - (rowBottom - rowTop) - FIT_TOLERANCE;

  // the first spot past the cut, found by halving since lines go downward
  let low = 0;
  let high = spots.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (isCut(spots[middle])) high = middle;
    else low = middle + 1;
  }

  // nothing to cut when every line stays
  if (keep === "first" ? low === spots.length : low === 0) return null;

  // a cut at a line's very start goes between lines, not inside one
  const spot = spots[low];
  const $spot = view.state.doc.resolve(spot);
  return $spot.parentOffset === 0
    ? spot - 1 - contentStart
    : spot - contentStart;
}
