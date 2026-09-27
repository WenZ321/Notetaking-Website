import type { ReactNode } from "react";
import { createPortal } from "react-dom";
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
  // Rendered on the body so the page's stacking and clipping never trap it under other UI
  return createPortal(
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
    </div>,
    document.body,
  );
}
