import { Extension } from "@tiptap/core";
import { keepWithinPage } from "./PageFit";
import { createPageFullPlugin } from "./PageFullPlugin";

type PageFullOptions = {
  onPageFull: (message: string) => void; // tells the user what didn't fit
};

type PageFullStorage = Pick<PageFullOptions, "onPageFull">;

declare module "@tiptap/core" {
  interface Storage {
    pageFull: PageFullStorage;
  }
}

// A page is a fixed size, so what's written has to stop at its bottom edge.
// Edits that would pass it are refused, and a paste keeps what fits
export const PageFull = Extension.create<PageFullOptions, PageFullStorage>({
  name: "pageFull",

  addOptions() {
    return { onPageFull: () => {} };
  },

  // lets anything with the editor tell the user the page is full
  addStorage() {
    return { onPageFull: this.options.onPageFull };
  },

  dispatchTransaction({ transaction, next }) {
    keepWithinPage(this.editor, transaction, next);
  },

  addProseMirrorPlugins() {
    return [createPageFullPlugin(this.options.onPageFull)];
  },
});
