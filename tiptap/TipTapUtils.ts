import type { Extensions, Editor } from "@tiptap/core";
import type { NotebookTemplate } from "@/types/Notebook";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type {
  TextFormatState,
  ToolbarField,
  ToolbarFormatState,
} from "@/types/TextFormatting";
import { isNodeSelection } from "@tiptap/core";
import {
  DefaultTextFormatState,
  EmptyToolbarFormatState,
} from "@/constants/TextFormattingConstants";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { DiagramBlock } from "@/tiptap/nodes/DiagramBlock/DiagramBlock";
import { MathBlock } from "@/tiptap/nodes/Math/MathBlock/MathBlock";
import { MathInline } from "@/tiptap/nodes/Math/MathInline/MathInline";
import { MatrixBlock } from "@/tiptap/nodes/Matrix/MatrixBlock";
import { ChemBlock } from "@/tiptap/nodes/Chem/ChemBlock/ChemBlock";
import { CodeBlock } from "@/tiptap/nodes/CodeBlock/CodeBlock";
import { Paragraph } from "@/tiptap/nodes/Paragraph/Paragraph";
import { WrappedBlock } from "@/tiptap/nodes/WrappedBlock/WrappedBlock";
import { WrappedColumn } from "@/tiptap/nodes/WrappedBlock/WrappedColumn";
import { DefaultTextFormat } from "@/tiptap/extensions/DefaultTextFormat/DefaultTextFormat";
import { WrappedBlockLayout } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/WrappedBlockLayout";
import { EmptyLineCaret } from "@/tiptap/extensions/EmptyLineCaret/EmptyLineCaret";
import { BlockDragAndDrop } from "@/tiptap/extensions/BlockDragAndDrop/BlockDragAndDrop";
import { DropOutline } from "@/tiptap/extensions/BlockDragAndDrop/DropOutline/DropOutline";
import { TextRemovalPreview } from "@/tiptap/extensions/TextRemovalPreview/TextRemovalPreview";
import { WrappedBlockTextFlow } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/WrappedBlockTextFlow";
import Math from "@tiptap/extension-mathematics";

// The full list of tiptap extensions used to build an editor instance,
// for a page on the given paper
export function createEditorExtensions(template: NotebookTemplate): Extensions {
  return [
    StarterKit.configure({
      dropcursor: false,
      // replaced by our own CodeBlock and Paragraph
      codeBlock: false,
      paragraph: false,
    }),
    Paragraph,
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    DefaultTextFormat,
    EmptyLineCaret,
    // Wraps outside underline so the underline draws on top of the color.
    // Same priority as TextStyle, which stays outside because it's listed first
    Highlight.extend({ priority: 101 }).configure({ multicolor: true }),
    DiagramBlock,
    Math,
    MathBlock,
    MathInline,
    MatrixBlock,
    ChemBlock,
    CodeBlock,
    WrappedBlock,
    WrappedColumn,
    WrappedBlockLayout,
    BlockDragAndDrop.configure({ template }),
    DropOutline,
    TextRemovalPreview,
    WrappedBlockTextFlow,
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
 * A selected node only has its own settings, the rest are null
 */
export function readFormatFromEditor(editor: Editor): ToolbarFormatState {
  const { selection } = editor.state;

  if (isNodeSelection(selection)) {
    const { node } = selection;
    const format = { ...EmptyToolbarFormatState }; // Creates a copy of EmptyToolbarFormatState
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

// Writes the toolbar values onto the selected node, only the settings it
// has and only the ones that changed
function updateSelectedNodeFormatting(
  editor: Editor,
  currentTextFormatState: ToolbarFormatState,
) {
  const { selection } = editor.state;
  if (!isNodeSelection(selection)) return;

  const tr = editor.state.tr;
  getToolbarFields(editor, selection.node).forEach((field) => {
    const value = currentTextFormatState[field];
    if (value !== null && selection.node.attrs[field] !== value) {
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
  currentTextFormatState: ToolbarFormatState,
) {
  if (!editor) return;

  // a selected node keeps its settings on itself, not in text marks
  if (isNodeSelection(editor.state.selection)) {
    updateSelectedNodeFormatting(editor, currentTextFormatState);
    return;
  }

  // selected text has every setting, so a null means the toolbar hasn't
  // caught up with the selection yet and nothing is written
  if (Object.values(currentTextFormatState).includes(null)) return;
  const textFormat = currentTextFormatState as TextFormatState;

  if (editor.isActive("bold") !== textFormat.isBold) {
    editor.commands.toggleBold();
  }

  if (editor.isActive("italic") !== textFormat.isItalic) {
    editor.commands.toggleItalic();
  }

  if (editor.isActive("underline") !== textFormat.isUnderline) {
    editor.commands.toggleUnderline();
  }

  const textStyleAttributes = editor.getAttributes("textStyle");

  if (textStyleAttributes.fontFamily !== textFormat.fontFamily) {
    editor.commands.setFontFamily(textFormat.fontFamily);
  }

  const fontSize = Number.isFinite(textFormat.fontSize)
    ? `${textFormat.fontSize}px`
    : `${DefaultTextFormatState.fontSize}px`;

  if (textStyleAttributes.fontSize !== fontSize) {
    editor.commands.setFontSize(fontSize);
  }

  if (textStyleAttributes.color !== textFormat.textColor) {
    editor.commands.setColor(textFormat.textColor);
  }

  const highlightAttributes = editor.getAttributes("highlight");

  if (highlightAttributes.color !== textFormat.highlightColor) {
    if (textFormat.highlightColor) {
      editor.commands.setHighlight({
        color: textFormat.highlightColor,
      });
    } else {
      editor.commands.unsetHighlight();
    }
  }
}
