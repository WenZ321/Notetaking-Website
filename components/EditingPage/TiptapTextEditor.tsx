"use client";
import { useEffect } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import type { TextFormatState } from "@/types/textFormatting";
import { createEditorExtensions } from "@/tiptap/TipTapUtils";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import "./TiptapTextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  currentTextFormatState: TextFormatState;
  content: JSONContent;
  updateTextFormatState: (newState: TextFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * Reads the current formatting state off the editor's active marks/selection.
 */
function readFormatFromEditor(editor: Editor): TextFormatState {
  const textStyleAttributes = editor.getAttributes("textStyle");
  const highlightAttributes = editor.getAttributes("highlight");

  return {
    isBold: editor.isActive("bold"),
    isItalic: editor.isActive("italic"),
    isUnderline: editor.isActive("underline"),
    fontFamily:
      textStyleAttributes.fontFamily ?? DefaultTextFormatState.fontFamily,
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
const updateEditorTextFormatting = (
  editor: Editor,
  currentTextFormatState: TextFormatState,
) => {
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

  if (textStyleAttributes.fontSize !== `${currentTextFormatState.fontSize}px`) {
    editor.commands.setFontSize(`${currentTextFormatState.fontSize}px`);
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
};

/**
 * A text editor component that uses TipTap for rich text editing.
 */
export default function TiptapTextEditor({
  currentTextFormatState,
  content,
  updateTextFormatState,
  onEditorReady,
}: Props) {
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content,
    editable: true,
    immediatelyRender: true,
    onSelectionUpdate: ({ editor }) => {
      updateTextFormatState(readFormatFromEditor(editor));
    },
  });

  useEffect(() => {
    if (!editor) return;

    onEditorReady(editor);
    editor.chain().focus("start").run();

    // Set default text formatting if first time loading the editor
    if (editor.isEmpty) {
      editor
        .chain()
        .setFontFamily(DefaultTextFormatState.fontFamily)
        .setFontSize(`${DefaultTextFormatState.fontSize}px`)
        .setColor(DefaultTextFormatState.textColor)
        .run();
    }

    updateTextFormatState(readFormatFromEditor(editor));
  }, [editor, onEditorReady]);

  useEffect(() => {
    updateEditorTextFormatting(editor, currentTextFormatState);
  }, [currentTextFormatState, editor]);

  const handleEditorFocus = () => {
    if (editor) {
      editor.commands.focus();
    }
  };

  return (
    <div className="editing-page-tiptap-text-editor-container">
      <div
        className="editing-page-tiptap-text-editor"
        style={
          {
            "--editor-width": `${NOTEBOOK_PAGE_WIDTH}px`,
            "--editor-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
          } as React.CSSProperties
        }
        onClick={handleEditorFocus}
      >
        <EditorContent
          editor={editor}
          className="editing-page-tiptap-text-editor-content"
        />
      </div>
    </div>
  );
}
