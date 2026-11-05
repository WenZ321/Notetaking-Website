import type { EditorView } from "@tiptap/pm/view";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

/**
 * Measures how far a wrapped block's text is allowed to reach, from the
 * bottom of its blocks as they're drawn on the page now
 * @param view The editor
 * @param wrappedBlockPos Where the wrapped block starts
 * @returns The blocks' bottom in the window, or null when one of its blocks
 * isn't drawn yet, or it has no blocks
 */
export function measureBlocksBottom(
  view: EditorView,
  wrappedBlockPos: number,
): number | null {
  const wrappedBlock = view.state.doc.nodeAt(wrappedBlockPos);
  if (!wrappedBlock) return null;

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

  return bottom;
}
