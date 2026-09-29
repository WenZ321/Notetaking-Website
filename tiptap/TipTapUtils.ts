import type { Extensions, Editor } from "@tiptap/core";
import type { TextFormatState } from "@/types/textFormatting";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/notebookPageConstants";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { DiagramBlock } from "@/tiptap/extensions/DiagramBlock/DiagramBlock";
import { MathBlock } from "@/tiptap/extensions/Math/MathBlock/MathBlock";
import { MathInline } from "@/tiptap/extensions/Math/MathInline/MathInline";
import { MatrixBlock } from "@/tiptap/extensions/Matrix/MatrixBlock";
import { ChemBlock } from "@/tiptap/extensions/Chem/ChemBlock/ChemBlock";
import Math from "@tiptap/extension-mathematics";

// The full list of tiptap extensions used to build an editor instance
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
    MathBlock.configure({
      maxWidth: NOTEBOOK_PAGE_WIDTH,
      maxHeight: NOTEBOOK_PAGE_HEIGHT,
    }),
    MathInline,
    MatrixBlock,
    ChemBlock.configure({
      maxWidth: NOTEBOOK_PAGE_WIDTH,
      maxHeight: NOTEBOOK_PAGE_HEIGHT,
    }),
  ];
}

/**
 * Reads the current formatting state off the editor's active marks/selection.
 */
export function readFormatFromEditor(editor: Editor): TextFormatState {
  const textStyleAttributes = editor.getAttributes("textStyle");
  const highlightAttributes = editor.getAttributes("highlight");

  return {
    isBold: editor.isActive("bold"),
    isItalic: editor.isActive("italic"),
    isUnderline: editor.isActive("underline"),
    fontFamily:
      textStyleAttributes.fontFamily ?? DefaultTextFormatState.fontFamily,
    // strip the unit (e.g. "16px" -> 16)
    fontSize:
      Number(textStyleAttributes.fontSize?.replace(/[a-z%]+$/i, "")) ||
      DefaultTextFormatState.fontSize,
    textColor: textStyleAttributes.color ?? DefaultTextFormatState.textColor,
    highlightColor:
      highlightAttributes.color ?? DefaultTextFormatState.highlightColor,
  };
}

/**
 * Applies currentTextFormatState onto the editor, only changing
 * commands whose target value actually differs from what's
 * currently active in the editor.
 */
export function updateEditorTextFormatting(
  editor: Editor,
  currentTextFormatState: TextFormatState,
) {
  if (!editor) return;

  if (editor.isActive("bold") !== currentTextFormatState.isBold) {
    editor.commands.toggleBold();
  }

  if (editor.isActive("italic") !== currentTextFormatState.isItalic) {
    editor.commands.toggleItalic();
  }

  if (editor.isActive("underline") !== currentTextFormatState.isUnderline) {
    editor.commands.toggleUnderline();
  }

  const textStyleAttributes = editor.getAttributes("textStyle");

  if (textStyleAttributes.fontFamily !== currentTextFormatState.fontFamily) {
    editor.commands.setFontFamily(currentTextFormatState.fontFamily);
  }

  const fontSize = Number.isFinite(currentTextFormatState.fontSize)
    ? `${currentTextFormatState.fontSize}px`
    : `${DefaultTextFormatState.fontSize}px`;

  if (textStyleAttributes.fontSize !== fontSize) {
    editor.commands.setFontSize(fontSize);
  }

  if (textStyleAttributes.color !== currentTextFormatState.textColor) {
    editor.commands.setColor(currentTextFormatState.textColor);
  }

  const highlightAttributes = editor.getAttributes("highlight");

  if (highlightAttributes.color !== currentTextFormatState.highlightColor) {
    if (currentTextFormatState.highlightColor) {
      editor.commands.setHighlight({
        color: currentTextFormatState.highlightColor,
      });
    } else {
      editor.commands.unsetHighlight();
    }
  }
}
