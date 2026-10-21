import type { EditorView } from "@tiptap/pm/view";
import type { OwnWrappedBlockMove } from "./FindDropTarget";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetBlockSurroundings";
import { joinText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { blockDragPluginKey } from "./DragState";
import { getBlockPosInColumn } from "./GetBlockPosInColumn";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

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

  const blockPos = getBlockPosInColumn(
    surroundings.wrappedBlockStart,
    columns,
    columns.indexOf(blockColumn),
  );

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(
      surroundings.wrappedBlockStart,
      surroundings.wrappedBlockEnd,
      wrappedBlockNode.copy(Fragment.from(columns)),
    );
  // a move rearranges the text, so cut-off lines no longer rejoin the line above
  makeLinesNewAfterDrop(tr, surroundings.wrappedBlockStart);
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  dispatchChange(view, tr, "ownStep");
}
