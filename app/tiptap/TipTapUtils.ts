import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import type { Extensions, JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { DiagramBlock } from "@/app/tiptap/extensions/DiagramBlock/DiagramBlock";
import { MathBlock } from "@/app/tiptap/extensions/Math/MathBlock/MathBlock";
import Math from "@tiptap/extension-mathematics";

export function createEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      dropcursor: false,
    }),
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    DiagramBlock.configure({
      maxWidth: NOTEBOOK_PAGE_WIDTH,
      maxHeight: NOTEBOOK_PAGE_HEIGHT,
    }),
    Math,
    MathBlock,
  ];
}

export function tiptapJsonToHtml(content: JSONContent): string {
  return generateHTML(content, createEditorExtensions());
}
