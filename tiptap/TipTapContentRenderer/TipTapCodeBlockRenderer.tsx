import type { JSONContent } from "@tiptap/core";
import type { CodeBlockAttrs } from "@/tiptap/nodes/CodeBlock/CodeBlockType";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import "@/tiptap/nodes/CodeBlock/CodeBlockEditor.css";

// Read-only render of a code block, straight from its saved attrs. It uses
// the same editor as the page so the colors match, with typing turned off
export function TipTapCodeBlockRenderer({ node }: { node: JSONContent }) {
  const attrs = node.attrs as CodeBlockAttrs;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const view = new EditorView({
      doc: attrs.code,
      extensions: [basicSetup, python(), EditorView.editable.of(false)],
      parent: container,
    });

    return () => view.destroy();
  }, [attrs.code]);

  return (
    <div
      ref={containerRef}
      className="code-block-editor"
      style={
        {
          "--code-block-width": `${attrs.width}px`,
          "--code-block-height": `${attrs.height}px`,
        } as React.CSSProperties
      }
    />
  );
}
