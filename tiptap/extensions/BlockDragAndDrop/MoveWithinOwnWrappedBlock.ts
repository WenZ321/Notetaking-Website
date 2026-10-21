import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { OwnWrappedBlockMove } from "./FindDropTarget";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { getBlockSurroundings } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/GetBlockSurroundings";
import { getNewspaperTextWidths } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { blockDragPluginKey } from "./DragState";
import { getBlockPosInColumn } from "./GetBlockPosInColumn";
import { sumNodeSizes } from "./SumNodeSizes";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

/**
 * Changes how the dragged block's own wrapped block wraps, and selects the
 * block. Wrapping left or right keeps only the block, so a newspaper's left
 * text goes above it and its right text below it. Becoming a newspaper
 * gives it an empty text column on each side, the left one set to the width
 * the block was dropped at
 * @param view The editor
 * @param move The new wrap
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

  const { schema } = state;
  const textOf = (column: ProseMirrorNode | undefined) =>
    column ? column.content.content : [];
  let above: ProseMirrorNode[] = [];
  let below: ProseMirrorNode[] = [];
  let columns: ProseMirrorNode[];

  if (move.wrap === "newspaper") {
    const [leftWidth, rightWidth] = getNewspaperTextWidths(
      blockColumn.firstChild!.attrs.width,
      move.leftTextWidth,
    );
    const emptyTextColumn = (width: number) =>
      schema.nodes.WrappedColumn.create(
        { columnType: "text", width },
        schema.nodes.paragraph.create(),
      );
    columns = [
      emptyTextColumn(leftWidth),
      blockColumn,
      emptyTextColumn(rightWidth),
    ];
  } else {
    above = [...textOf(surroundings.textBefore?.node)];
    below = [...textOf(surroundings.textAfter?.node)];
    columns = [blockColumn];
  }

  const wrappedBlock = wrappedBlockNode.type.create(
    { ...wrappedBlockNode.attrs, wrap: move.wrap },
    Fragment.from(columns),
  );
  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(surroundings.wrappedBlockStart, surroundings.wrappedBlockEnd, [
      ...above,
      wrappedBlock,
      ...below,
    ]);

  // a move rearranges the text, so cut-off lines no longer rejoin the line above
  const wrappedBlockStart =
    surroundings.wrappedBlockStart + sumNodeSizes(above);
  makeLinesNewAfterDrop(tr, wrappedBlockStart);

  const blockPos = getBlockPosInColumn(
    wrappedBlockStart,
    columns,
    columns.indexOf(blockColumn),
  );
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  dispatchChange(view, tr, "ownStep");
  flowWrappedBlockText(view, wrappedBlockStart);
}
