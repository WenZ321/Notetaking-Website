import type { ReactNode } from "react";
import { useContext } from "react";
import { createPortal } from "react-dom";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
import { NotebookCoverStyleContext } from "@/components/NotebookPage/NotebookCoverStyleContext";
import { BlockNodeEditorCloseButton } from "./BlockNodeEditorCloseButton";
import "./BlockNodeEditorOverlay.css";

type BlockNodeEditorOverlayProps = {
  closeEditor: () => void;
  backgroundClassName?: string;
  // Only editors with their own toolbar pass one, it sits on the cover rim
  toolbar?: ReactNode;
  children: ReactNode;
};

export function BlockNodeEditorOverlay({
  backgroundClassName,
  toolbar,
  children,
  closeEditor,
}: BlockNodeEditorOverlayProps) {
  const coverStyle = useContext(NotebookCoverStyleContext);

  // Rendered on the body so the page's stacking and clipping never trap it under other UI
  return createPortal(
    <div
      className="block-node-editor-overlay"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* The notebook's cover rim, with the editor's paper inside it */}
      <div
        className="block-node-editor-cover"
        style={getCoverColorVariables(coverStyle)}
      >
        <BlockNodeEditorCloseButton closeEditor={closeEditor} />
        {toolbar}
        <div
          className={
            backgroundClassName
              ? `block-node-editor-background ${backgroundClassName}`
              : "block-node-editor-background"
          }
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
