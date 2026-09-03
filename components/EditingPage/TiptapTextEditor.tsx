"use client";
import { useEffect } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { createEditorExtensions } from "@/tiptap/TipTapUtils";
import "./TiptapTextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  onEditorReady: (editor: Editor) => void;
  content: JSONContent;
};

/**
 * A text editor component that uses TipTap for rich text editing.
 */
export default function TiptapTextEditor({ onEditorReady, content }: Props) {
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content,
    editable: true,
    immediatelyRender: true,
  });

  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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
