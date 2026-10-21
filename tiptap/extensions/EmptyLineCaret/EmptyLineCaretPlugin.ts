import type { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";

const emptyLineCaretPluginKey = new PluginKey("emptyLineCaret");

// An empty line has no text to take its size from, so the cursor there
// would use the page's size. This gives the line the size and font that
// the next typed text will get, so the cursor doesn't jump when typing
function getEmptyLineDecorations(state: EditorState) {
  const { selection, storedMarks, doc } = state;
  const { $from } = selection;

  if (!selection.empty) return null;
  if (!$from.parent.isTextblock || $from.parent.content.size > 0) return null;

  const textStyle = (storedMarks ?? $from.marks()).find(
    (mark) => mark.type.name === "textStyle",
  );
  const fontSize =
    textStyle?.attrs.fontSize || `${DefaultTextFormatState.fontSize}px`;
  const fontFamily =
    textStyle?.attrs.fontFamily || DefaultTextFormatState.fontFamily;

  return DecorationSet.create(doc, [
    Decoration.node($from.before(), $from.after(), {
      class: "empty-line-with-caret",
      style: `--empty-line-font-size: ${fontSize}; --empty-line-font-family: ${fontFamily}`,
    }),
  ]);
}

export function createEmptyLineCaretPlugin(): Plugin {
  return new Plugin({
    key: emptyLineCaretPluginKey,

    props: {
      decorations: getEmptyLineDecorations,
    },
  });
}
