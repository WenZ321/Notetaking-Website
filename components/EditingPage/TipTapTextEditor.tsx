"use client";
import type { Editor, JSONContent } from "@tiptap/core";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { createEditorExtensions } from "@/tiptap/TipTapUtils";
import { readFormatFromEditor } from "@/tiptap/TipTapUtils";
import { NotebookPaper } from "../NotebookPaperTypes/NotebookPaper";
import { NotebookPaperTypeContext } from "../NotebookPaperTypes/NotebookPaperTypeContext";
import "./TipTapTextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  content: JSONContent;
  paperType: NotebookPaperType;
  updateTextFormatState: (newState: ToolbarFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * A text editor component that uses TipTap for rich text editing.
 */
export function TipTapTextEditor({
  content,
  paperType,
  updateTextFormatState,
  onEditorReady,
}: Props) {
  const editor = useEditor({
    extensions: createEditorExtensions(paperType),
    content,
    editable: true,
    immediatelyRender: true,
    onSelectionUpdate: ({ editor }) => {
      updateTextFormatState(readFormatFromEditor(editor));
    },
  });

  // TipTap destroys an editor that isn't on screen within a moment of being
  // made, which happens when it's made during a page change, and hands over
  // a new one once it is. Only that new one is set up
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

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
  }, [editor, onEditorReady, updateTextFormatState]);

  const handleEditorFocus = () => {
    if (editor) {
      editor.commands.focus();
    }
  };

  return (
    <div className="editing-page-tiptap-text-editor-container">
      <div
        className="editing-page-tiptap-text-editor"
        onClick={handleEditorFocus}
      >
        <NotebookPaper paperType={paperType} />
        {/* Lets blocks on the page fit their size to the paper */}
        <NotebookPaperTypeContext value={paperType}>
          <EditorContent
            editor={editor}
            className="editing-page-tiptap-text-editor-content notebook-page-text"
          />
        </NotebookPaperTypeContext>
      </div>
    </div>
  );
}
