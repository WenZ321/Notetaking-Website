import type { Extensions, Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { TextFormatState } from "@/types/textFormatting";
import type { ToolbarField } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/ReactNodeFactory";
import { isNodeSelection } from "@tiptap/core";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/notebookPageConstants";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { DiagramBlock } from "@/tiptap/nodes/DiagramBlock/DiagramBlock";
import { MathBlock } from "@/tiptap/nodes/Math/MathBlock/MathBlock";
import { MathInline } from "@/tiptap/nodes/Math/MathInline/MathInline";
import { MatrixBlock } from "@/tiptap/nodes/Matrix/MatrixBlock";
import { ChemBlock } from "@/tiptap/nodes/Chem/ChemBlock/ChemBlock";
import { WrappedBlock } from "@/tiptap/nodes/WrappedBlock/WrappedBlock";
import { WrappedColumn } from "@/tiptap/nodes/WrappedBlock/WrappedColumn";
import { DefaultTextFormat } from "@/tiptap/extensions/DefaultTextFormat/DefaultTextFormat";
import { WrappedBlockLayout } from "@/tiptap/extensions/WrappedBlockLayout/WrappedBlockLayout";
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
    DefaultTextFormat,
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
    MatrixBlock.configure({
      maxWidth: NOTEBOOK_PAGE_WIDTH,
      maxHeight: NOTEBOOK_PAGE_HEIGHT,
    }),
    ChemBlock.configure({
      maxWidth: NOTEBOOK_PAGE_WIDTH,
      maxHeight: NOTEBOOK_PAGE_HEIGHT,
    }),
    WrappedBlock,
    WrappedColumn,
    WrappedBlockLayout,
  ];
}

// The toolbar settings a node has. Nodes that list none, like the diagram
// block, have no toolbar settings at all
function getToolbarFields(
  editor: Editor,
  node: ProseMirrorNode,
): readonly ToolbarField[] {
  const extension = editor.extensionManager.extensions.find(
    (ext) => ext.name === node.type.name,
  );
  return extension?.options.toolbarFields ?? [];
}

/**
 * Reads the current formatting state off the editor's active marks/selection.
 * A selected block only gives the settings it has, the rest are left out
 */
export function readFormatFromEditor(editor: Editor): Partial<TextFormatState> {
  const { selection } = editor.state;

  if (isNodeSelection(selection)) {
    const { node } = selection;
    const format: Partial<TextFormatState> = {};
    getToolbarFields(editor, node).forEach((field) => {
      format[field] = node.attrs[field];
    });
    return format;
  }

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

// Writes the toolbar values onto the selected block, only the settings it
// has and only the ones that changed
function updateSelectedNodeFormatting(
  editor: Editor,
  currentTextFormatState: TextFormatState,
) {
  const { selection } = editor.state;
  if (!isNodeSelection(selection)) return;

  const tr = editor.state.tr;
  getToolbarFields(editor, selection.node).forEach((field) => {
    const value = currentTextFormatState[field];
    if (selection.node.attrs[field] !== value) {
      tr.setNodeAttribute(selection.from, field, value);
    }
  });

  if (tr.docChanged) editor.view.dispatch(tr);
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

  // a selected block keeps its settings on itself, not in text marks
  if (isNodeSelection(editor.state.selection)) {
    updateSelectedNodeFormatting(editor, currentTextFormatState);
    return;
  }

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
