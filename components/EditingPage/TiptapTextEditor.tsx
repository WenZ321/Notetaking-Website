"use client";
import type { Editor, JSONContent } from "@tiptap/core";
import type { ToolbarFormatState } from "@/types/textFormatting";
import type { NotebookTemplate } from "@/types/notebook";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { createEditorExtensions } from "@/tiptap/TipTapUtils";
import { readFormatFromEditor } from "@/tiptap/TipTapUtils";
import { NotebookPaper } from "../NotebookTemplates/NotebookPaper";
import { NotebookTemplateContext } from "../NotebookTemplates/NotebookTemplateContext";
import "./TiptapTextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  content: JSONContent;
  template: NotebookTemplate;
  updateTextFormatState: (newState: ToolbarFormatState) => void;
  onEditorReady: (editor: Editor) => void;
};

/**
 * A text editor component that uses TipTap for rich text editing.
 */
export function TiptapTextEditor({
  content,
  template,
  updateTextFormatState,
  onEditorReady,
}: Props) {
  const editor = useEditor({
    extensions: createEditorExtensions(template),
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
        <NotebookPaper template={template} />
        {/* Lets blocks on the page fit their size to the paper */}
        <NotebookTemplateContext value={template}>
          <EditorContent
            editor={editor}
            className="editing-page-tiptap-text-editor-content notebook-page-text"
          />
        </NotebookTemplateContext>
      </div>
    </div>
  );
}
