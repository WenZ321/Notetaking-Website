import type { EditorView } from "@tiptap/pm/view";
import type { OtherWrappedBlockDrop } from "../FindDropTarget";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "../DragState";
import { getDroppedBlockPos } from "../WrappedBlockDropLogic/GetDroppedBlockPos";
import { readHistoryState } from "./ReadHistoryState";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

/**
 * Shows a wrapped block drop on the page while dragging: the wrapped block is swapped for the
 * saved outcome, with a copy of the dragged block in it, while the original
 * stays hidden where it was. Kept out of undo, and the page and history
 * from before are saved so the preview can be taken away exactly
 * @param view The editor
 * @param otherWrappedBlockDrop The wrapped block and the outcome saved when the target was found
 */
export function showLiveDropPreview(
  view: EditorView,
  otherWrappedBlockDrop: OtherWrappedBlockDrop,
) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const oldWrappedBlock = state.doc.nodeAt(
    otherWrappedBlockDrop.wrappedBlockStart,
  );
  if (!drag || drag.preview || !oldWrappedBlock) return;

  const {
    above,
    wrappedBlock: newWrappedBlock,
    below,
  } = otherWrappedBlockDrop.outcome;
  const tr = state.tr.replaceWith(
    otherWrappedBlockDrop.wrappedBlockStart,
    otherWrappedBlockDrop.wrappedBlockStart + oldWrappedBlock.nodeSize,
    [...above, newWrappedBlock, ...below],
  );

  // the original moves along if it comes after the wrapped block
  const from = tr.mapping.map(drag.from);
  tr.setMeta(LIVE_DROP_PREVIEW_META, true).setMeta(blockDragPluginKey, {
    ...drag,
    from,
    to: from + (drag.to - drag.from),
    preview: {
      otherWrappedBlockDrop,
      docBeforePreview: state.doc,
      fromBeforePreview: drag.from,
      historyBeforePreview: readHistoryState(state),
      copyPos: getDroppedBlockPos(
        otherWrappedBlockDrop.wrappedBlockStart,
        otherWrappedBlockDrop.outcome,
      ),
    },
  });

  dispatchChange(view, tr, "skipUndo");
}
