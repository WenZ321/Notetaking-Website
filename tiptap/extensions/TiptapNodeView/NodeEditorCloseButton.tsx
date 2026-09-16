import { X } from "lucide-react";
import "./NodeEditorCloseButton.css";

type NodeEditorCloseButtonProps = {
  closeEditor: () => void;
};

export function NodeEditorCloseButton({
  closeEditor,
}: NodeEditorCloseButtonProps) {
  return (
    <button className="tiptap-node-editor-close-button" onClick={closeEditor}>
      <X />
    </button>
  );
}
