import type { Editor } from "@tiptap/core";
import { fitWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/TextFitting/fitWrappedBlockText";

/**
 * Cuts the wrapped block's text to the wrapped block's new size once a resize ends, moving
 * the lines that no longer fit above or below the wrapped block. It joins the
 * resize's undo step, so one undo puts both back
 * @param editor The editor
 * @param blockPos Where the resized block starts
 */
export function fitWrappedBlockAfterResize(editor: Editor, blockPos: number) {
  const { state, view } = editor;
  const $block = state.doc.resolve(blockPos);
  if ($block.parent.type.name !== "WrappedColumn") return;

  const wrappedBlockPos = $block.before($block.depth - 1);
  const fitted = fitWrappedBlockText(view, wrappedBlockPos);
  const wrappedBlock = state.doc.nodeAt(wrappedBlockPos);
  if (!fitted || !wrappedBlock) return;

  const tr = state.tr.replaceWith(
    wrappedBlockPos,
    wrappedBlockPos + wrappedBlock.nodeSize,
    [...fitted.above, fitted.wrappedBlock, ...fitted.below],
  );

  // marked as following another change, so undo groups it with the resize
  tr.setMeta("appendedTransaction", tr);
  view.dispatch(tr);
}
