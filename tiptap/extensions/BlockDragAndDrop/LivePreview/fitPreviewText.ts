import type { EditorView } from "@tiptap/pm/view";
import type { RowDrop } from "../findDropTarget";
import { ROW_PREVIEW_META, blockDragPluginKey } from "../dragState";
import { getDroppedBlockPos } from "../OtherRowDrop/getDroppedBlockPos";
import { fitRowText } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/fitRowText";

/**
 * Cuts the previewed row's text to the row's height, now that it's drawn
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

  const { rowDrop } = preview;
  const { above, row, below } = rowDrop.result;
  const aboveSize = above.reduce((sum, line) => sum + line.nodeSize, 0);
  const fitted = fitRowText(view, rowDrop.rowStart + aboveSize);
  if (!fitted) return;

  // left text that left goes just above the row, right text just below
  const result = {
    ...rowDrop.result,
    above: [...above, ...fitted.above],
    row: fitted.row,
    below: [...fitted.below, ...below],
  };
  const fittedDrop: RowDrop = { ...rowDrop, result };

  const previewSize = [...above, row, ...below].reduce(
    (sum, node) => sum + node.nodeSize,
    0,
  );
  const tr = state.tr.replaceWith(
    rowDrop.rowStart,
    rowDrop.rowStart + previewSize,
    [...result.above, result.row, ...result.below],
  );

  // the hidden original moves along if it comes after the row
  const from = tr.mapping.map(drag.from);
  tr.setMeta(ROW_PREVIEW_META, true)
    .setMeta("addToHistory", false)
    .setMeta(blockDragPluginKey, {
      ...drag,
      from,
      to: from + (drag.to - drag.from),
      target: drag.target && { ...drag.target, rowDrop: fittedDrop },
      preview: {
        ...preview,
        rowDrop: fittedDrop,
        copyPos: getDroppedBlockPos(rowDrop.rowStart, result),
      },
    });

  view.dispatch(tr);
}
