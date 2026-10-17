import type { EditorView } from "@tiptap/pm/view";
import type { WrappedBlockDrop } from "../findDropTarget";
import { WRAPPED_BLOCK_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { getDroppedBlockPos } from "../OtherWrappedBlockDrop/getDroppedBlockPos";
import { fitWrappedBlockText } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/fitWrappedBlockText";

/**
 * Cuts the previewed wrapped block's text to the wrapped block's height, now that it's drawn
 * on the page. The lines that no longer fit join the text above or below,
 * and the saved target gets the cut result, so the drop makes exactly
 * what the preview shows
 * @param view The editor
 */
export function fitPreviewText(view: EditorView) {
  const { state } = view;
  const drag = blockDragPluginKey.getState(state);
  const preview = drag?.preview;
  if (!drag || !preview) return;

  const { wrappedBlockDrop } = preview;
  const { above, wrappedBlock, below } = wrappedBlockDrop.result;
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  const fitted = fitWrappedBlockText(
    view,
    wrappedBlockDrop.wrappedBlockStart + aboveSize,
  );
  if (!fitted) return;

  // left text that left goes just above the wrapped block, right text just below
  const result = {
    ...wrappedBlockDrop.result,
    above: [...above, ...fitted.above],
    wrappedBlock: fitted.wrappedBlock,
    below: [...fitted.below, ...below],
  };
  const fittedDrop: WrappedBlockDrop = { ...wrappedBlockDrop, result };

  const previewSize = [...above, wrappedBlock, ...below].reduce(
    (sum, node) => sum + node.nodeSize,
    0,
  );
  const tr = state.tr.replaceWith(
    wrappedBlockDrop.wrappedBlockStart,
    wrappedBlockDrop.wrappedBlockStart + previewSize,
    [...result.above, result.wrappedBlock, ...result.below],
  );

  // the hidden original moves along if it comes after the wrapped block
  const from = tr.mapping.map(drag.from);
  tr.setMeta(WRAPPED_BLOCK_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from,
      to: from + (drag.to - drag.from),
      target: drag.target && { ...drag.target, wrappedBlockDrop: fittedDrop },
      preview: {
        ...preview,
        wrappedBlockDrop: fittedDrop,
        copyPos: getDroppedBlockPos(wrappedBlockDrop.wrappedBlockStart, result),
      },
    });

  view.dispatch(tr);
}
