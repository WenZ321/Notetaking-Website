import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "../FindDropTarget";
import {
  LIVE_DROP_PREVIEW_META,
  blockDragPluginKey,
  getLeavingRange,
} from "../DragState";
import { getDroppedBlockPos } from "../WrappedBlockDropLogic/GetDroppedBlockPos";
import { buildOwnWrappedBlockMove } from "../MoveWithinOwnWrappedBlock";
import { readHistoryState } from "./ReadHistoryState";
import {
  arrangeTopLevelNode,
  getWrappedBlockTypes,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// What a preview swaps in, built from the same outcome the drop uses
type PreviewSwap = {
  start: number; // where the swapped stretch starts
  end: number; // where the swapped stretch ends, the same as start when it only adds
  shownNodes: ProseMirrorNode[];
  copyPos: number; // where the dragged block shown by the preview starts
  showsDraggedBlock: boolean; // true when it shows the dragged block itself, false for a copy while the original stays hidden
};

// What the page shows for a drop into another wrapped block: that wrapped
// block with a copy of the dragged block in it, while the original stays
// hidden where it was
function buildOtherDropSwap(
  view: EditorView,
  target: DropTarget,
): PreviewSwap | null {
  const drop = target.otherWrappedBlockDrop;
  const oldWrappedBlock = drop && view.state.doc.nodeAt(drop.wrappedBlockStart);
  if (!drop || !oldWrappedBlock) return null;

  return {
    start: drop.wrappedBlockStart,
    end: drop.wrappedBlockStart + oldWrappedBlock.nodeSize,
    shownNodes: [drop.outcome.wrappedBlock],
    copyPos: getDroppedBlockPos(drop.wrappedBlockStart, drop.outcome),
    showsDraggedBlock: false,
  };
}

// What the page shows for a move within the block's own wrapped block: that
// wrapped block with its new wrap. The block itself moves along with it
function buildOwnMoveSwap(
  view: EditorView,
  target: DropTarget,
  from: number,
): PreviewSwap | null {
  const move = target.ownWrappedBlockMove;
  const outcome = move && buildOwnWrappedBlockMove(view.state, from, move);
  if (!outcome) return null;

  return {
    start: outcome.start,
    end: outcome.end,
    shownNodes: outcome.nodes,
    copyPos: outcome.blockPos,
    showsDraggedBlock: true,
  };
}

// Where the copy of the dragged block sits among the shown nodes. The
// wrapped block rules may give it the row's shared height, so it's matched
// by everything but its height
function findCopyPos(
  shownNodes: ProseMirrorNode[],
  start: number,
  block: ProseMirrorNode,
): number | null {
  const isCopy = (node: ProseMirrorNode) =>
    node.type === block.type &&
    Object.keys(block.attrs).every(
      (key) => key === "height" || node.attrs[key] === block.attrs[key],
    );

  let copyPos: number | null = null;
  let nodeStart = start;
  for (const node of shownNodes) {
    node.descendants((child, offset) => {
      if (copyPos === null && isCopy(child)) copyPos = nodeStart + 1 + offset;
      return copyPos === null;
    });
    nodeStart += node.nodeSize;
  }
  return copyPos;
}

// What the page shows for a drop into the text: the dragged block placed the
// way the wrapped block rules will place it once it's dropped. A copy is
// shown while the original stays hidden, unless the original is in that same
// stretch, like moving a block within its own row of blocks. Then it's
// taken out and put back in, just like the drop does, and shown itself
function buildTextDropSwap(
  view: EditorView,
  target: DropTarget,
  from: number,
): PreviewSwap | null {
  const { state } = view;
  const block = state.doc.nodeAt(from);
  if (!block) return null;

  // a drop between top level nodes adds its own wrapped block there. A drop
  // inside one changes that whole node
  const $target = state.doc.resolve(target.pos);
  const isBetween = $target.depth === 0;
  const start = isBetween ? target.pos : $target.before(1);
  const end = isBetween ? target.pos : $target.after(1);

  const isInSameStretch = from >= start && from < end;
  const tr = state.tr;
  if (isInSameStretch) {
    const leaving = getLeavingRange(tr.doc, from, from + block.nodeSize);
    tr.delete(leaving.from, leaving.to);
  }
  tr.insert(tr.mapping.map(target.pos), block);
  const changed = tr.doc.slice(start, tr.mapping.map(end, 1));
  const types = getWrappedBlockTypes(state.schema);
  const shownNodes = changed.content.content.flatMap((node) =>
    arrangeTopLevelNode(node, types),
  );

  // a wrapped block is always followed by a line of text, like the rules do
  const nextNode = state.doc.resolve(end).nodeAfter;
  const isLastWrappedBlock =
    shownNodes[shownNodes.length - 1]?.type === types.wrappedBlockNodeType;
  if (isLastWrappedBlock && !nextNode?.isTextblock) {
    shownNodes.push(types.paragraphNodeType.create());
  }

  const copyPos = findCopyPos(shownNodes, start, block);
  if (copyPos === null) return null;
  return {
    start,
    end,
    shownNodes,
    copyPos,
    showsDraggedBlock: isInSameStretch,
  };
}

/**
 * Shows a drop on the page while dragging, with the dragged block's content,
 * so the page looks exactly like it will after the drop. Kept out of undo,
 * and the page and history from before are saved so the preview can be
 * taken away exactly
 * @param view The editor
 * @param target The target to show: into another wrapped block, within the
 * block's own, or into the text
 * @param shownAtTop The ghost's top edge from the editor's top, so the
 * preview can stay while the ghost stays near it
 * @returns False when no preview could be built for the target
 */
export function showLiveDropPreview(
  view: EditorView,
  target: DropTarget,
  shownAtTop: number,
): boolean {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  if (!drag || drag.preview || target.isHome) return false;

  const isOwnMove = target.ownWrappedBlockMove !== null;
  let swap: PreviewSwap | null;
  if (isOwnMove) swap = buildOwnMoveSwap(view, target, drag.from);
  else if (target.otherWrappedBlockDrop)
    swap = buildOtherDropSwap(view, target);
  else swap = buildTextDropSwap(view, target, drag.from);
  if (!swap) return false;

  const tr = state.tr.replaceWith(swap.start, swap.end, swap.shownNodes);

  // a hidden original moves along if it comes after the swapped stretch.
  // When the preview shows the dragged block itself, that's where it is
  const from = swap.showsDraggedBlock
    ? swap.copyPos
    : tr.mapping.map(drag.from);
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from,
    to: from + (drag.to - drag.from),
    preview: {
      target,
      start: swap.start,
      replacedSize: swap.end - swap.start,
      shownNodes: swap.shownNodes,
      docBeforePreview: state.doc,
      fromBeforePreview: drag.from,
      historyBeforePreview: readHistoryState(state),
      copyPos: swap.copyPos,
      showsDraggedBlock: swap.showsDraggedBlock,
      shownAtTop,
    },
  });

  dispatchChange(view, tr, "skipUndo");
  return true;
}
