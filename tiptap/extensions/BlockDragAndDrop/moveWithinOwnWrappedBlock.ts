import type { EditorView } from "@tiptap/pm/view";
import type { WrappedBlockMove } from "./findDropTarget";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { getBlockWrappedBlock } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/getBlockWrappedBlock";
import { joinText } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { blockDragPluginKey } from "./dragState";
import { clearFlowMarkers } from "@/tiptap/extensions/WrappedBlockTextFlow/clearFlowMarkers";

/**
 * Moves the dragged block within its own wrapped block and selects it. At a side, the
 * wrapped block's text joins into one column on the other side, left text first. In
 * the middle, the text stays where it is and an empty text column opens on
 * the other side
 * @param view The editor
 * @param move Where in the wrapped block the block goes
 */
export function moveWithinOwnWrappedBlock(
  view: EditorView,
  move: WrappedBlockMove,
) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const wrappedBlock = drag && getBlockWrappedBlock(state, drag.from);
  const wrappedBlockNode =
    wrappedBlock && state.doc.nodeAt(wrappedBlock.wrappedBlockStart);
  const blockColumn =
    wrappedBlock && state.doc.nodeAt(wrappedBlock.columnStart);
  if (!wrappedBlock || !wrappedBlockNode || !blockColumn) return;

  const createTextColumn = (text: Fragment, width: number | null = null) =>
    state.schema.nodes.WrappedColumn.create(
      { columnType: "text", width },
      text.size ? text : state.schema.nodes.paragraph.create(),
    );

  let columns;
  if (move.side === "middle") {
    const text =
      (wrappedBlock.textBefore ?? wrappedBlock.textAfter)?.node.content ??
      Fragment.empty;
    const [leftText, rightText] = wrappedBlock.textBefore
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
        wrappedBlock.textBefore?.node.content ?? Fragment.empty,
        wrappedBlock.textAfter?.node.content ?? Fragment.empty,
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
    wrappedBlock.wrappedBlockStart +
    1 +
    columns.slice(0, blockIndex).reduce((sum, c) => sum + c.nodeSize, 0) +
    1;

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(
      wrappedBlock.wrappedBlockStart,
      wrappedBlock.wrappedBlockEnd,
      wrappedBlockNode.copy(Fragment.from(columns)),
    );
  // a move is a one-time change, so text pushed out of the wrapped block earlier stays put
  clearFlowMarkers(tr, wrappedBlock.wrappedBlockStart);
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);
}
