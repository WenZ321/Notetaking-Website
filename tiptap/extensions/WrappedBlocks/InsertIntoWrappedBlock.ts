import type { CommandProps } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { NotebookTemplate } from "@/types/Notebook";
import type {
  CustomBlockNode,
  WrappedBlockNode,
  WrappedColumnNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import { NodeSelection } from "@tiptap/pm/state";
import { getPaperSnapBlockSide } from "@/components/NotebookTemplates/NotebookTemplates";
import { makeLinesNewAfterDrop } from "./WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { addBlockToRow } from "./AddBlockToRow";
import {
  getBlockPosInColumn,
  getRowDom,
  isTextColumn,
  readContentMinSize,
  sumNodeSizes,
} from "./WrappedBlockUtils";

// The wrapped block the cursor is beside, and how the inserted block joins it:
// a floated row the cursor's line sits next to, or a newspaper the cursor
// is in, on the side of the text column it's in
type RowBesideCursor = {
  wrappedBlockPos: number;
  wrappedBlock: WrappedBlockNode;
  side: "left" | "right" | null; // a newspaper's text column side, null for a floated row
};

// A newspaper text column the cursor is in, and which side it's on
function findNewspaperAtCursor(tr: Transaction): RowBesideCursor | null {
  const { $from } = tr.selection;
  for (let depth = $from.depth; depth > 1; depth--) {
    const column = $from.node(depth);
    const wrappedBlock = $from.node(depth - 1);
    if (
      column.type.name === "WrappedColumn" &&
      wrappedBlock.attrs.wrap === "newspaper" &&
      isTextColumn(column)
    ) {
      const isFirstColumn = $from.index(depth - 1) === 0;
      return {
        wrappedBlockPos: $from.before(depth - 1),
        wrappedBlock,
        side: isFirstColumn ? "left" : "right",
      };
    }
  }
  return null;
}

// The floated row the cursor's line sits next to on the page. The text
// beside a floated row comes after it, so only rows before the cursor's
// line are looked at, nearest first
function findFloatedRowBesideCursor(
  view: EditorView,
  tr: Transaction,
): RowBesideCursor | null {
  const { $from } = tr.selection;
  if ($from.depth !== 1 || !$from.parent.isTextblock) return null;

  const cursor = view.coordsAtPos(tr.selection.from);
  let found: RowBesideCursor | null = null;
  tr.doc.forEach((node, pos, index) => {
    if (index >= $from.index(0) || node.type.name !== "WrappedBlock") return;
    if (node.attrs.wrap === "newspaper") return;

    const rowDom = getRowDom(view, pos);
    if (!rowDom) return;
    const rowRect = rowDom.getBoundingClientRect();
    const isBeside = cursor.top < rowRect.bottom && cursor.bottom > rowRect.top;
    if (isBeside)
      found = { wrappedBlockPos: pos, wrappedBlock: node, side: null };
  });
  return found;
}

/**
 * Puts a newly inserted block into the row the cursor is beside, instead of
 * starting a new row at the cursor. Beside a floated row it joins that row
 * on the side facing the text. In a newspaper's text column it takes that
 * column's place, so the row wraps to that side, with the left text moved
 * above it and the right text below. The row is built the same way as a
 * drop into it
 * @param props The insert command's props
 * @param block The block being inserted
 * @param template The page's paper, which sizes snap to
 * @returns True when it was put in a row, false when it doesn't fit there
 * or the cursor isn't beside one, so it's inserted at the cursor as usual
 */
export function insertIntoWrappedBlock(
  { tr, editor, dispatch }: CommandProps,
  block: CustomBlockNode,
  template: NotebookTemplate,
): boolean {
  const { view } = editor;
  const row = findNewspaperAtCursor(tr) ?? findFloatedRowBesideCursor(view, tr);
  if (!row) return false;

  const { wrappedBlock, wrappedBlockPos, side } = row;
  const columns = wrappedBlock.content.content;
  const blockColumns = columns.filter((column) => !isTextColumn(column));

  // a newspaper wraps to the side its block replaces the text on
  const wrap = side ?? (wrappedBlock.attrs.wrap as "left" | "right");

  // Beside a floated row the new block goes on the side facing the text: the
  // right end of a row wrapped left, the left end of one wrapped right. In a
  // newspaper it goes where the replaced text column was
  const isAtRightEnd = side === null ? wrap === "left" : side === "right";

  const newRow = addBlockToRow({
    wrappedBlock,
    wrap,
    insertIndex: isAtRightEnd ? blockColumns.length : 0,
    newBlock: block,
    newBlockMinSize: { width: 0, height: 0 },
    existingBlockMinSizes: blockColumns.map((column) =>
      readContentMinSize(
        view,
        wrappedBlockPos + 1 + columnOffset(columns, column) + 1,
      ),
    ),
    snapBlockSide: getPaperSnapBlockSide(template),
  });
  if (!newRow) return false;

  if (dispatch) {
    const { above, below } = newRow;
    tr.replaceWith(wrappedBlockPos, wrappedBlockPos + wrappedBlock.nodeSize, [
      ...above,
      newRow.wrappedBlock,
      ...below,
    ]);

    // the text is rearranged, so cut-off lines no longer rejoin the line above
    const newWrappedBlockPos = wrappedBlockPos + sumNodeSizes(above);
    makeLinesNewAfterDrop(tr, newWrappedBlockPos);

    const newBlockPos = getBlockPosInColumn(
      newWrappedBlockPos,
      newRow.wrappedBlock.content.content,
      newRow.newColumnIndex,
    );
    tr.setSelection(NodeSelection.create(tr.doc, newBlockPos));
  }
  return true;
}

// How far into the wrapped block a column starts
function columnOffset(
  columns: readonly WrappedColumnNode[],
  column: WrappedColumnNode,
): number {
  return sumNodeSizes(columns.slice(0, columns.indexOf(column)));
}
