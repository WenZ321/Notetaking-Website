import type { EditorView } from "@tiptap/pm/view";
import type { OtherWrappedBlockDrop } from "../findDropTarget";
import { LIVE_DROP_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { getDroppedBlockPos } from "../OtherWrappedBlockDrop/getDroppedBlockPos";
import { fitWrappedBlockText } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/fitWrappedBlockText";

/**
 * Cuts the previewed wrapped block's text to the wrapped block's height, now that it's drawn
 * on the page. The lines that no longer fit join the text above or below,
 * and the saved target gets the cut outcome, so the drop makes exactly
 * what the preview shows
 * @param view The editor
 */
export function fitPreviewText(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const { otherWrappedBlockDrop } = preview;
  const {
    above,
    wrappedBlock: newWrappedBlock,
    below,
  } = otherWrappedBlockDrop.outcome;
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  const fitted = fitWrappedBlockText(
    view,
    otherWrappedBlockDrop.wrappedBlockStart + aboveSize,
  );
  if (!fitted) return;

  // left text that left goes just above the wrapped block, right text just below
  const outcome = {
    ...otherWrappedBlockDrop.outcome,
    above: [...above, ...fitted.above],
    wrappedBlock: fitted.wrappedBlock,
    below: [...fitted.below, ...below],
  };
  const fittedDrop: OtherWrappedBlockDrop = {
    ...otherWrappedBlockDrop,
    outcome,
  };

  const previewSize = [...above, newWrappedBlock, ...below].reduce(
    (sum, node) => sum + node.nodeSize,
    0,
  );
  const tr = state.tr.replaceWith(
    otherWrappedBlockDrop.wrappedBlockStart,
    otherWrappedBlockDrop.wrappedBlockStart + previewSize,
    [...outcome.above, outcome.wrappedBlock, ...outcome.below],
  );

  // the hidden original moves along if it comes after the wrapped block
  const from = tr.mapping.map(drag.from);
  tr.setMeta(LIVE_DROP_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from,
      to: from + (drag.to - drag.from),
      target: drag.target && {
        ...drag.target,
        otherWrappedBlockDrop: fittedDrop,
      },
      preview: {
        ...preview,
        otherWrappedBlockDrop: fittedDrop,
        copyPos: getDroppedBlockPos(
          otherWrappedBlockDrop.wrappedBlockStart,
          outcome,
        ),
      },
    });

  view.dispatch(tr);
}
