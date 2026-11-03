import type { EditorView } from "@tiptap/pm/view";

/**
 * How much bigger the page is drawn on screen than its real size, when the
 * notebook is grown to fit a big screen. Distances measured on screen are
 * divided by it to get the page's own pixels, which sizes and drops use
 * @param view The editor
 * @returns The page's scale, 1 when it's drawn at its real size
 */
export function getPageScale(view: EditorView): number {
  const realWidth = view.dom.offsetWidth;
  if (realWidth === 0) return 1;
  return view.dom.getBoundingClientRect().width / realWidth;
}
