import type { EditorView } from "@tiptap/pm/view";
import type { OwnWrappedBlockMove } from "./findDropTarget";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/getBlockSurroundings";
import { joinText } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { blockDragPluginKey } from "./dragState";
import { clearFlowMarkersAfterDrop } from "@/tiptap/extensions/WrappedBlockTextFlow/clearFlowMarkersAfterDrop";

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
  move: OwnWrappedBlockMove,
) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const surroundings = drag && getBlockSurroundings(state, drag.from);
  const wrappedBlockNode =
    surroundings && state.doc.nodeAt(surroundings.wrappedBlockStart);
  const blockColumn =
    surroundings && state.doc.nodeAt(surroundings.columnStart);
  if (!surroundings || !wrappedBlockNode || !blockColumn) return;

  const createTextColumn = (text: Fragment, width: number | null = null) =>
    state.schema.nodes.WrappedColumn.create(
      { columnType: "text", width },
      text.size ? text : state.schema.nodes.paragraph.create(),
    );

  let columns;
  if (move.side === "middle") {
    const text =
      (surroundings.textBefore ?? surroundings.textAfter)?.node.content ??
      Fragment.empty;
    const [leftText, rightText] = surroundings.textBefore
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
        surroundings.textBefore?.node.content ?? Fragment.empty,
        surroundings.textAfter?.node.content ?? Fragment.empty,
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
    surroundings.wrappedBlockStart +
    1 +
    columns.slice(0, blockIndex).reduce((sum, c) => sum + c.nodeSize, 0) +
    1;

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(
      surroundings.wrappedBlockStart,
      surroundings.wrappedBlockEnd,
      wrappedBlockNode.copy(Fragment.from(columns)),
    );
  // a move is a one-time change, so text pushed out of the wrapped block earlier stays put
  clearFlowMarkersAfterDrop(tr, surroundings.wrappedBlockStart);
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  view.dispatch(tr);
}
