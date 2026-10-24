import type { EditorView } from "@tiptap/pm/view";
import {
  getRowDom,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

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
 * the wrapped block or one of its blocks isn't drawn yet, or it has no blocks
 */
export function measureWrappedBlockBounds(
  view: EditorView,
  wrappedBlockPos: number,
): WrappedBlockBounds | null {
  const wrappedBlock = view.state.doc.nodeAt(wrappedBlockPos);
  const wrappedBlockDom = getRowDom(view, wrappedBlockPos);
  if (!wrappedBlock || !wrappedBlockDom) return null;

  let bottom = -Infinity;
  let isEveryBlockDrawn = true;
  wrappedBlock.forEach((column, offset) => {
    if (isTextColumn(column)) return;
    const columnDom = view.nodeDOM(wrappedBlockPos + 1 + offset);
    const columnRect =
      columnDom instanceof HTMLElement
        ? columnDom.getBoundingClientRect()
        : null;

    // a block is drawn a moment after it's added, and has no height until then
    if (!columnRect || columnRect.height === 0) isEveryBlockDrawn = false;
    else bottom = Math.max(bottom, columnRect.bottom);
  });
  if (!isEveryBlockDrawn || bottom === -Infinity) return null;

  return { top: wrappedBlockDom.getBoundingClientRect().top, bottom };
}
