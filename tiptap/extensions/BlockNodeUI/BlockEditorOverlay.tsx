import type { ReactNode } from "react";
import { BlockEditorCloseButton } from "./BlockEditorCloseButton";
import "./BlockEditorOverlay.css";

type BlockEditorOverlayProps = {
  closeEditor: () => void;
  backgroundClassName?: string;
  children: ReactNode;
};

export function BlockEditorOverlay({
  closeEditor,
  backgroundClassName,
  children,
}: BlockEditorOverlayProps) {
  return (
    <div
      className="block-editor-overlay"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={
          backgroundClassName
            ? `block-editor-background ${backgroundClassName}`
            : "block-editor-background"
        }
      >
        <BlockEditorCloseButton closeEditor={closeEditor} />
        {children}
      </div>
    </div>
  );
}
