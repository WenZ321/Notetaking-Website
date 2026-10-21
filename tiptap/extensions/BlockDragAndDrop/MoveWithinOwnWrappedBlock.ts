import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
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
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// What a block's own wrapped block turns into when the block is moved
// within it: the stretch of page it replaces, what goes there, and where
// the block ends up
export type OwnWrappedBlockMoveOutcome = {
  start: number; // where the old wrapped block starts
  end: number; // where the old wrapped block ends
  nodes: ProseMirrorNode[]; // the text above, the new wrapped block, and the text below
  wrappedBlockStart: number; // where the new wrapped block starts once placed
  blockPos: number; // where the block starts once placed
};

/**
 * Builds what a block's own wrapped block turns into with a new wrap.
 * Wrapping left or right keeps only the block, so a newspaper's left text
 * goes above it and its right text below it. Becoming a newspaper gives it
 * an empty text column on each side, the left one set to the width the
 * block was dropped at. Used for both the preview and the drop, so they match
 * @param state The editor state
 * @param from Where the block starts
 * @param move The new wrap
 * @returns The outcome, or null when the block isn't in a wrapped block
 */
export function buildOwnWrappedBlockMove(
  state: EditorState,
  from: number,
  move: OwnWrappedBlockMove,
): OwnWrappedBlockMoveOutcome | null {
  const surroundings = getBlockSurroundings(state, from);
  const wrappedBlockNode =
    surroundings && state.doc.nodeAt(surroundings.wrappedBlockStart);
  const blockColumn =
    surroundings && state.doc.nodeAt(surroundings.columnStart);
  if (!surroundings || !wrappedBlockNode || !blockColumn) return null;

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
  const wrappedBlockStart =
    surroundings.wrappedBlockStart + sumNodeSizes(above);

  return {
    start: surroundings.wrappedBlockStart,
    end: surroundings.wrappedBlockEnd,
    nodes: [...above, wrappedBlock, ...below],
    wrappedBlockStart,
    blockPos: getBlockPosInColumn(
      wrappedBlockStart,
      columns,
      columns.indexOf(blockColumn),
    ),
  };
}

/**
 * Changes how the dragged block's own wrapped block wraps, as one change so
 * one undo puts it back, and selects the block
 * @param view The editor
 * @param move The new wrap
 */
export function moveWithinOwnWrappedBlock(
  view: EditorView,
  move: OwnWrappedBlockMove,
) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const outcome = drag && buildOwnWrappedBlockMove(state, drag.from, move);
  if (!outcome) return;

  const tr = state.tr
    .setMeta(blockDragPluginKey, null)
    .replaceWith(outcome.start, outcome.end, outcome.nodes);

  // a move rearranges the text, so cut-off lines no longer rejoin the line above
  makeLinesNewAfterDrop(tr, outcome.wrappedBlockStart);

  tr.setSelection(NodeSelection.create(tr.doc, outcome.blockPos));
  dispatchChange(view, tr, "ownStep");
}
