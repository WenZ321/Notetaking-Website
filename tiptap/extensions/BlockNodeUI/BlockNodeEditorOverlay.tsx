import type { ReactNode } from "react";
import { BlockNodeEditorCloseButton } from "./BlockNodeEditorCloseButton";
import "./BlockNodeEditorOverlay.css";

type BlockNodeEditorOverlayProps = {
  closeEditor: () => void;
  backgroundClassName?: string;
  children: ReactNode;
};

export function BlockNodeEditorOverlay({
  closeEditor,
  backgroundClassName,
  children,
}: BlockNodeEditorOverlayProps) {
  return (
    <div
      className="block-node-editor-overlay"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={
          backgroundClassName
            ? `block-node-editor-background ${backgroundClassName}`
            : "block-node-editor-background"
        }
      >
        <BlockNodeEditorCloseButton closeEditor={closeEditor} />
        {children}
      </div>
    </div>
  );
}
