"use client";

import { useEffect } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { DiagramBlock } from "../extensions/DiagramBlock/DiagramBlock";
import { MathBlock } from "../extensions/Math/MathBlock/MathBlock";
import Math from "@tiptap/extension-mathematics";
import "./TextEditor.css";
import "katex/dist/katex.min.css";

type Props = {
  editable: boolean;
  width: number;
  height: number;
  content?: JSONContent;
  onActivate?: (editor: Editor) => void;
};

export default function TextEditor({
  editable,
  width,
  height,
  content,
  onActivate,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: false,
      }),
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      DiagramBlock.configure({ maxWidth: width, maxHeight: height }),
      Math,
      MathBlock,
    ],
    content: content ?? "<p></p>",
    editable,
  });

  useEffect(() => {
    if (editor && editable && onActivate) {
      onActivate(editor);
      editor.commands.focus();
    }
  }, [editor, editable, onActivate]);

  return (
    <div
      className="page-editor"
      style={
        {
          "--editor-width": `${width}px`,
          "--editor-height": `${height}px`,
        } as React.CSSProperties
      }
      onClick={() => {
        editor && onActivate?.(editor);
        console.log("clicked");
      }} // TODO
    >
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
