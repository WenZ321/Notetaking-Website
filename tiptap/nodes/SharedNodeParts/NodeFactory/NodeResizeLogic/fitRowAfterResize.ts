import type { Editor } from "@tiptap/core";
import { fitRowText } from "@/tiptap/extensions/WrappedBlockLayout/TextFitting/fitRowText";

/**
 * Cuts the row's text to the row's new size once a resize ends, moving
 * the lines that no longer fit above or below the row. It joins the
 * resize's undo step, so one undo puts both back
 * @param editor The editor
 * @param blockPos Where the resized block starts
 */
export function fitRowAfterResize(editor: Editor, blockPos: number) {
  const { state, view } = editor;
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return;

  const rowPos = $block.before($block.depth - 1);
  const fitted = fitRowText(view, rowPos);
  const row = state.doc.nodeAt(rowPos);
  if (!fitted || !row) return;

  const tr = state.tr.replaceWith(rowPos, rowPos + row.nodeSize, [
    ...fitted.above,
    fitted.row,
    ...fitted.below,
  ]);

  // marked as following another change, so undo groups it with the resize
  tr.setMeta("appendedTransaction", tr);
  view.dispatch(tr);
}
