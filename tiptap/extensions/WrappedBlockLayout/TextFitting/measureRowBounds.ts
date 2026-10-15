import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "../arrangeWrappedBlocks";

// A row's top edge, and the bottom of its blocks, which text can't pass
export type RowBounds = {
  top: number;
  bottom: number;
};

/**
 * Measures how far a row's text is allowed to reach, from the row as it's
 * drawn on the page now
 * @param view The editor
 * @param rowPos Where the row starts
 * @returns The row's top and its blocks' bottom in the window, or null when
 * the row isn't drawn or has no blocks
 */
export function measureRowBounds(
  view: EditorView,
  rowPos: number,
): RowBounds | null {
  const row = view.state.doc.nodeAt(rowPos);
  const rowDom = view.nodeDOM(rowPos);
  if (!row || !(rowDom instanceof HTMLElement)) return null;

  let bottom = -Infinity;
  row.forEach((column, offset) => {
    const columnDom = view.nodeDOM(rowPos + 1 + offset);
    if (!isTextColumn(column) && columnDom instanceof HTMLElement) {
      bottom = Math.max(bottom, columnDom.getBoundingClientRect().bottom);
    }
  });
  if (bottom === -Infinity) return null;

  return { top: rowDom.getBoundingClientRect().top, bottom };
}
