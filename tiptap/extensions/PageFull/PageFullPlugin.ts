import { Plugin } from "@tiptap/pm/state";
import { pasteWhatFits } from "./PasteWhatFits";

// Steps in when a paste is too big for the page
export function createPageFullPlugin(
  onPageFull: (message: string) => void,
): Plugin {
  return new Plugin({
    props: {
      handlePaste: (view, _event, slice) =>
        pasteWhatFits(view, slice, onPageFull),
    },
  });
}
