import type { EditorView } from "@tiptap/pm/view";
import type { RowMove } from "./findDropTarget";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { getBlockRow } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/getBlockRow";
import { joinText } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { blockDragPluginKey } from "./dragState";

/**
 * Moves the dragged block within its own row and selects it. At a side, the
 * row's text joins into one column on the other side, left text first. In
 * the middle, the text stays where it is and an empty text column opens on
 * the other side
 * @param view The editor
 * @param move Where in the row the block goes
 */
export function moveWithinOwnRow(view: EditorView, move: RowMove) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const row = drag && getBlockRow(state, drag.from);
  const rowNode = row && state.doc.nodeAt(row.rowStart);
  const blockColumn = row && state.doc.nodeAt(row.columnStart);
  if (!row || !rowNode || !blockColumn) return;

  const createTextColumn = (text: Fragment, width: number | null = null) =>
    state.schema.nodes.WrappedColumn.create(
      { columnType: "text", width },
      text.size ? text : state.schema.nodes.paragraph.create(),
    );

  let columns;
  if (move.side === "middle") {
    const text =
      (row.textBefore ?? row.textAfter)?.node.content ?? Fragment.empty;
    const [leftText, rightText] = row.textBefore
      ? [text, Fragment.empty]
      : [Fragment.empty, text];
    columns = [
      createTextColumn(leftText, move.leftTextWidth),
      blockColumn,
      createTextColumn(rightText),
    ];
  } else {
    const textColumn = createTextColumn(
      joinText(
        row.textBefore?.node.content ?? Fragment.empty,
        row.textAfter?.node.content ?? Fragment.empty,
      ),
    );
    columns =
      move.side === "left"
        ? [blockColumn, textColumn]
        : [textColumn, blockColumn];
  }

  // the block sits just inside its column, after the columns before it
  const blockIndex = columns.indexOf(blockColumn);
  const blockPos =
    row.rowStart +
    1 +
    columns.slice(0, blockIndex).reduce((sum, c) => sum + c.nodeSize, 0) +
    1;

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(
      row.rowStart,
      row.rowEnd,
      rowNode.copy(Fragment.from(columns)),
    );
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);
}
