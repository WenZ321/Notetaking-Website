import type { EditorView } from "@tiptap/pm/view";
import type { MinBlockSize } from "./readContentMinSize";
import { readContentMinSize } from "./readContentMinSize";

// One column in a measured wrapped block. For a block column, pos and end are the
// block itself. For a text column, they're where its lines start and end
export type MeasuredColumn = {
  columnType: "block" | "text";
  pos: number;
  end: number;
  left: number;
  right: number;
  minSize: MinBlockSize | null; // the smallest size a block's content allows, null for text
};

// A wrapped block the dragged block can drop into, with its columns left to right.
// Sizes are measured from the editor's top left corner so scrolling during
// the drag doesn't throw them off
export type MeasuredWrappedBlock = {
  wrappedBlockStart: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  columns: MeasuredColumn[];
};

/**
 * Measures every wrapped block other than the dragged block's own wrapped block. Done once
 * when the drag starts, so the drop zones stay put while the page changes
 * under the cursor
 * @param view The editor
 * @param from Where the dragged block starts
 * @returns The wrapped blocks, top to bottom
 */
export function measureOtherWrappedBlocks(
  view: EditorView,
  from: number,
): MeasuredWrappedBlock[] {
  const editorRect = view.dom.getBoundingClientRect();
  const wrappedBlocks: MeasuredWrappedBlock[] = [];

  view.state.doc.forEach((wrappedBlockNode, wrappedBlockStart) => {
    if (wrappedBlockNode.type.name !== "WrappedBlock") return;
    if (
      from > wrappedBlockStart &&
      from < wrappedBlockStart + wrappedBlockNode.nodeSize
    )
      return;

    const wrappedBlockDom = view.nodeDOM(wrappedBlockStart);
    if (!(wrappedBlockDom instanceof HTMLElement)) return;

    const columns: MeasuredColumn[] = [];
    wrappedBlockNode.forEach((column, offset) => {
      const columnStart = wrappedBlockStart + 1 + offset;
      const columnDom = view.nodeDOM(columnStart);
      if (!(columnDom instanceof HTMLElement)) return;

      const columnRect = columnDom.getBoundingClientRect();
      const isBlock = column.attrs.columnType === "block";
      columns.push({
        columnType: column.attrs.columnType,
        pos: columnStart + 1,
        end: columnStart + column.nodeSize - 1,
        left: columnRect.left - editorRect.left,
        right: columnRect.right - editorRect.left,
        minSize: isBlock ? readContentMinSize(view, columnStart + 1) : null,
      });
    });

    const wrappedBlockRect = wrappedBlockDom.getBoundingClientRect();
    wrappedBlocks.push({
      wrappedBlockStart,
      top: wrappedBlockRect.top - editorRect.top,
      bottom: wrappedBlockRect.bottom - editorRect.top,
      left: wrappedBlockRect.left - editorRect.left,
      right: wrappedBlockRect.right - editorRect.left,
      columns,
    });
  });

  return wrappedBlocks;
}
