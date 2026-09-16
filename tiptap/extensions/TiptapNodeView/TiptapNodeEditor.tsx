import type { ReactNode } from "react";
import { NodeEditorCloseButton } from "./NodeEditorCloseButton";
import "./TiptapNodeEditor.css";

type TiptapNodeEditorProps = {
  closeEditor: () => void;
  backgroundClassName?: string;
  children: ReactNode;
};

export function TiptapNodeEditor({
  closeEditor,
  backgroundClassName,
  children,
}: TiptapNodeEditorProps) {
  return (
    <div
      className="tiptap-node-editor-overlay"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={
          backgroundClassName
            ? `tiptap-node-editor-background ${backgroundClassName}`
            : "tiptap-node-editor-background"
        }
      >
        <NodeEditorCloseButton closeEditor={closeEditor} />
        {children}
      </div>
    </div>
  );
}
