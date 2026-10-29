import type { NotebookPaperType } from "@/types/Notebook";
import { createPortal } from "react-dom";
import { NOTEBOOK_PAPER_TYPES } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import "./PaperTypePicker.css";

type PaperTypePickerProps = {
  onPick: (paperType: NotebookPaperType) => void;
  onClose: () => void;
};

/**
 * A pop up with a button for each paper type, which closes when the dimmed space around it is clicked
 */
export function PaperTypePicker({ onPick, onClose }: PaperTypePickerProps) {
  const paperTypes = Object.keys(NOTEBOOK_PAPER_TYPES) as NotebookPaperType[];

  // Only clicks on the dimmed space itself close it, not clicks inside the pop up
  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // Rendered on the body so the template row's scrolling and hover styles never reach it
  return createPortal(
    <div
      className="user-notebooks-page-paper-type-picker-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="user-notebooks-page-paper-type-picker">
        {paperTypes.map((paperType) => (
          <button
            key={paperType}
            className="user-notebooks-page-paper-type-picker-button"
            onClick={() => onPick(paperType)}
          >
            {NOTEBOOK_PAPER_TYPES[paperType].label}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
