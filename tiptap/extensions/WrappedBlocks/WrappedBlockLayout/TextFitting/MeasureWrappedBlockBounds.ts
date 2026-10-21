import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "../ArrangeWrappedBlocks";

// A wrapped block's top edge, and the bottom of its blocks, which text can't pass
export type WrappedBlockBounds = {
  top: number;
  bottom: number;
};

/**
 * Measures how far a wrapped block's text is allowed to reach, from the wrapped block as it's
 * drawn on the page now
 * @param view The editor
 * @param wrappedBlockPos Where the wrapped block starts
 * @returns The wrapped block's top and its blocks' bottom in the window, or null when
 * the wrapped block isn't drawn or has no blocks
 */
export function measureWrappedBlockBounds(
  view: EditorView,
  wrappedBlockPos: number,
): WrappedBlockBounds | null {
  const wrappedBlock = view.state.doc.nodeAt(wrappedBlockPos);
  const wrappedBlockDom = view.nodeDOM(wrappedBlockPos);
  if (!wrappedBlock || !(wrappedBlockDom instanceof HTMLElement)) return null;

  let bottom = -Infinity;
  wrappedBlock.forEach((column, offset) => {
    const columnDom = view.nodeDOM(wrappedBlockPos + 1 + offset);
    if (!isTextColumn(column) && columnDom instanceof HTMLElement) {
      bottom = Math.max(bottom, columnDom.getBoundingClientRect().bottom);
    }
  });
  if (bottom === -Infinity) return null;

  return { top: wrappedBlockDom.getBoundingClientRect().top, bottom };
}
