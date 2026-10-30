import type { NotebookPaperType } from "@/types/Notebook";
import { NOTEBOOK_PAPER_TYPES } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import "./PaperTypePicker.css";

type PaperTypePickerProps = {
  pickedPaperType: NotebookPaperType;
  onPick: (paperType: NotebookPaperType) => void;
};

/**
 * A button for each paper type, with the picked one marked
 */
export function PaperTypePicker({
  pickedPaperType,
  onPick,
}: PaperTypePickerProps) {
  const paperTypes = Object.keys(NOTEBOOK_PAPER_TYPES) as NotebookPaperType[];

  return (
    <div className="user-notebooks-page-paper-type-picker">
      {paperTypes.map((paperType) => (
        <button
          key={paperType}
          className="user-notebooks-page-paper-type-picker-button"
          aria-pressed={paperType === pickedPaperType}
          onClick={() => onPick(paperType)}
        >
          {NOTEBOOK_PAPER_TYPES[paperType].label}
        </button>
      ))}
    </div>
  );
}
