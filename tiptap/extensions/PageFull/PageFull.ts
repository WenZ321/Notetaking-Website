import { Extension } from "@tiptap/core";
import { keepWithinPage } from "./PageFit";
import { createPageFullPlugin } from "./PageFullPlugin";

type PageFullOptions = {
  onPageFull: (message: string) => void; // tells the user what didn't fit
};

// A page is a fixed size, so what's written has to stop at its bottom edge.
// Edits that would pass it are refused, and a paste keeps what fits
export const PageFull = Extension.create<PageFullOptions>({
  name: "pageFull",

  addOptions() {
    return { onPageFull: () => {} };
  },

  dispatchTransaction({ transaction, next }) {
    keepWithinPage(
      this.editor.view,
      transaction,
      next,
      this.options.onPageFull,
    );
  },

  addProseMirrorPlugins() {
    return [createPageFullPlugin(this.options.onPageFull)];
  },
});
