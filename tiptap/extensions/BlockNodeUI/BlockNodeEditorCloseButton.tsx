import { X } from "lucide-react";
import "./BlockNodeEditorCloseButton.css";

type BlockNodeEditorCloseButtonProps = {
  closeEditor: () => void;
};

export function BlockNodeEditorCloseButton({
  closeEditor,
}: BlockNodeEditorCloseButtonProps) {
  return (
    <button className="block-node-editor-close-button" onClick={closeEditor}>
      <X />
    </button>
  );
}
