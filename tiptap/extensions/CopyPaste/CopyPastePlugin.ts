import { Plugin } from "@tiptap/pm/state";
import { makePastedTextNewLines } from "./MakePastedTextNewLines";

// Changes pasted content before it's put on the page
export function createCopyPastePlugin(): Plugin {
  return new Plugin({
    props: {
      transformPasted: (pasted) => makePastedTextNewLines(pasted),
    },
  });
}
