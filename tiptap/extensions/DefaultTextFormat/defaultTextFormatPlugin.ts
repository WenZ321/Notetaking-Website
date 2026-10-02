import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";

const defaultTextFormatPluginKey = new PluginKey("defaultTextFormat");

// The default text format, as text style values. Bold, italic, underline
// and highlight are off by default, so they have nothing to add
const DEFAULT_TEXT_STYLE = {
  fontFamily: DefaultTextFormatState.fontFamily,
  fontSize: `${DefaultTextFormatState.fontSize}px`,
  color: DefaultTextFormatState.textColor,
};

// The parts of the page that the changes added or edited
function getChangedRanges(transactions: readonly Transaction[]) {
  let ranges: { from: number; to: number }[] = [];

  transactions.forEach((tr) => {
    tr.mapping.maps.forEach((stepMap) => {
      // earlier ranges shift as later changes add or remove content
      ranges = ranges.map(({ from, to }) => ({
        from: stepMap.map(from, -1),
        to: stepMap.map(to, 1),
      }));
      stepMap.forEach((_oldFrom, _oldTo, from, to) => {
        ranges.push({ from, to });
      });
    });
  });

  return ranges;
}

// Gives the default font, size and color to any new text missing them,
// so text never falls back to the page's own style
export function createDefaultTextFormatPlugin(): Plugin {
  return new Plugin({
    key: defaultTextFormatPluginKey,

    appendTransaction: (transactions, _oldState, newState) => {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const textStyleType = newState.schema.marks.textStyle;
      const tr = newState.tr;
      const docSize = newState.doc.content.size;

      getChangedRanges(transactions).forEach(({ from, to }) => {
        newState.doc.nodesBetween(
          Math.max(0, from),
          Math.min(docSize, to),
          (node, pos, parent) => {
            if (!node.isText) return;
            if (!parent?.type.allowsMarkType(textStyleType)) return;

            const textStyle = node.marks.find(
              (mark) => mark.type === textStyleType,
            );
            const { fontFamily, fontSize, color } = textStyle?.attrs ?? {};
            if (fontFamily && fontSize && color) return;

            // only fills in what's missing, the text's own styles stay
            tr.addMark(
              pos,
              pos + node.nodeSize,
              textStyleType.create({
                ...textStyle?.attrs,
                fontFamily: fontFamily || DEFAULT_TEXT_STYLE.fontFamily,
                fontSize: fontSize || DEFAULT_TEXT_STYLE.fontSize,
                color: color || DEFAULT_TEXT_STYLE.color,
              }),
            );
          },
        );
      });

      // null means every new text already had its style
      return tr.docChanged ? tr : null;
    },
  });
}
