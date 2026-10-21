import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "../FindDropTarget";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "../DragState";
import { getDroppedBlockPos } from "../WrappedBlockDropLogic/GetDroppedBlockPos";
import { buildOwnWrappedBlockMove } from "../MoveWithinOwnWrappedBlock";
import { readHistoryState } from "./ReadHistoryState";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// What a preview swaps in, built from the same outcome the drop uses
type PreviewSwap = {
  start: number; // where the swapped wrapped block starts
  end: number; // where the swapped wrapped block ends
  shownNodes: ProseMirrorNode[];
  copyPos: number; // where the dragged block shown by the preview starts
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
  };
}

/**
 * Shows a drop on the page while dragging, so the page looks exactly like
 * it will after the drop. Kept out of undo, and the page and history from
 * before are saved so the preview can be taken away exactly
 * @param view The editor
 * @param target The target to show, into another wrapped block or within
 * the block's own
 */
export function showLiveDropPreview(view: EditorView, target: DropTarget) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  if (!drag || drag.preview) return;

  const isOwnMove = target.ownWrappedBlockMove !== null;
  const swap = isOwnMove
    ? buildOwnMoveSwap(view, target, drag.from)
    : buildOtherDropSwap(view, target);
  if (!swap) return;

  const tr = state.tr.replaceWith(swap.start, swap.end, swap.shownNodes);

  // for a drop into another wrapped block the hidden original moves along
  // if it comes after it. For an own move the block is the one shown
  const from = isOwnMove ? swap.copyPos : tr.mapping.map(drag.from);
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from,
    to: from + (drag.to - drag.from),
    preview: {
      target,
      start: swap.start,
      shownNodes: swap.shownNodes,
      docBeforePreview: state.doc,
      fromBeforePreview: drag.from,
      historyBeforePreview: readHistoryState(state),
      copyPos: swap.copyPos,
    },
  });

  dispatchChange(view, tr, "skipUndo");
}
