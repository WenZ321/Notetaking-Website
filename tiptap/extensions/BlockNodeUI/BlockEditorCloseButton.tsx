import { X } from "lucide-react";
import "./BlockEditorCloseButton.css";

type BlockEditorCloseButtonProps = {
  closeEditor: () => void;
};

export function BlockEditorCloseButton({
  closeEditor,
}: BlockEditorCloseButtonProps) {
  return (
    <button className="block-editor-close-button" onClick={closeEditor}>
      <X />
    </button>
  );
}
