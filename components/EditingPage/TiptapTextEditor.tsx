"use client";
import { useEffect } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/textFormattingConstants";
import { createEditorExtensions } from "@/app/tiptap/TipTapUtils";
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
  });

  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div
      className="page-editor"
      style={
        {
          "--editor-width": `${NOTEBOOK_PAGE_WIDTH}px`,
          "--editor-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
        } as React.CSSProperties
      }
    >
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
