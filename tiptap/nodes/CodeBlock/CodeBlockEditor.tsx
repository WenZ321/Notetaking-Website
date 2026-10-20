import type { InPageEditorComponentProps } from "../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { CodeBlockAttrs } from "./CodeBlockType";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import "./CodeBlockEditor.css";

// A code editor that sits right on the page and saves the code into the
// node as you type
export function CodeBlockEditor({
  node,
  updateAttributes,
}: InPageEditorComponentProps<CodeBlockAttrs>) {
  // The empty box CodeMirror draws itself into
  const containerRef = useRef<HTMLDivElement>(null);
  // Only read once to fill the editor, after that the editor holds the code
  const startingCode = useRef(node.attrs.code);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const view = new EditorView({
      doc: startingCode.current,
      extensions: [
        basicSetup,
        python(),
        // saves the code into the node every time it changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            updateAttributes({ code: update.state.doc.toString() });
          }
        }),
      ],
      parent: container,
    });

    return () => view.destroy();
  }, [updateAttributes]);

  return (
    <div
      ref={containerRef}
      className="code-block-editor"
      style={
        {
          "--code-block-width": `${node.attrs.width}px`,
          "--code-block-height": `${node.attrs.height}px`,
        } as React.CSSProperties
      }
    />
  );
}
