import type { EditorView } from "@tiptap/pm/view";

// The smallest size a block's content allows
export type MinBlockSize = {
  width: number;
  height: number;
};

const MIN_SIZE_SELECTOR = "[data-content-min-width]";

/**
 * Reads the smallest size a block's content allows, which the block's view
 * writes on the page. Blocks that don't report one get 0
 * @param view The editor
 * @param pos Where the block starts
 * @returns The smallest width and height
 */
export function readContentMinSize(
  view: EditorView,
  pos: number,
): MinBlockSize {
  const dom = view.nodeDOM(pos);
  const element =
    dom instanceof HTMLElement
      ? dom.matches(MIN_SIZE_SELECTOR)
        ? dom
        : dom.querySelector<HTMLElement>(MIN_SIZE_SELECTOR)
      : null;

  return {
    width: Number(element?.dataset.contentMinWidth ?? 0),
    height: Number(element?.dataset.contentMinHeight ?? 0),
  };
}
