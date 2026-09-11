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
import {
  readFormatFromEditor,
  updateEditorTextFormatting,
} from "@/tiptap/TipTapUtils";
import "./TiptapTextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  currentTextFormatState: TextFormatState;
  content: JSONContent;
  updateTextFormatState: (newState: TextFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * A text editor component that uses TipTap for rich text editing.
 */
export function TiptapTextEditor({
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
