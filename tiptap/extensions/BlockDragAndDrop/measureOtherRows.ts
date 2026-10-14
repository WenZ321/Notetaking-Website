import type { EditorView } from "@tiptap/pm/view";
import type { MinBlockSize } from "./readContentMinSize";
import { readContentMinSize } from "./readContentMinSize";

// One column in a measured row. For a block column, pos and end are the
// block itself. For a text column, they're where its lines start and end
export type MeasuredColumn = {
  columnType: "block" | "text";
  pos: number;
  end: number;
  left: number;
  right: number;
  minSize: MinBlockSize | null; // the smallest size a block's content allows, null for text
};

// A row the dragged block can drop into, with its columns left to right.
// Sizes are measured from the editor's top left corner so scrolling during
// the drag doesn't throw them off
export type MeasuredRow = {
  rowStart: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  columns: MeasuredColumn[];
};

/**
 * Measures every row other than the dragged block's own row. Done once
 * when the drag starts, so the drop zones stay put while the page changes
 * under the cursor
 * @param view The editor
 * @param from Where the dragged block starts
 * @returns The rows, top to bottom
 */
export function measureOtherRows(
  view: EditorView,
  from: number,
): MeasuredRow[] {
  const editorRect = view.dom.getBoundingClientRect();
  const rows: MeasuredRow[] = [];

  view.state.doc.forEach((rowNode, rowStart) => {
    if (rowNode.type.name !== "WrappedBlock") return;
    if (from > rowStart && from < rowStart + rowNode.nodeSize) return;

    const rowDom = view.nodeDOM(rowStart);
    if (!(rowDom instanceof HTMLElement)) return;

    const columns: MeasuredColumn[] = [];
    rowNode.forEach((column, offset) => {
      const columnStart = rowStart + 1 + offset;
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

    const rowRect = rowDom.getBoundingClientRect();
    rows.push({
      rowStart,
      top: rowRect.top - editorRect.top,
      bottom: rowRect.bottom - editorRect.top,
      left: rowRect.left - editorRect.left,
      right: rowRect.right - editorRect.left,
      columns,
    });
  });

  return rows;
}
