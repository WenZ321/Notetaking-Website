import type { TextFormattingToolbarPopover } from "@/types/TextFormatting";
import { COLORS } from "@/constants/TextFormattingConstants";
import "./TextFormattingColorPicker.css";

type HighlighterColorPickerProps = {
  color: string;
  isOpen: boolean;
  disabled?: boolean;
  onTogglePopover: (popover: TextFormattingToolbarPopover) => void;
  onColorChange: (color: string) => void;
};

/**
 * Allows users to select a highlight color for text formatting.
 * Displays a button with a handwritten A on a rough marker stroke of the currently selected color, dashed when there's none.
 */
export function HighlighterColorPicker({
  color,
  isOpen,
  disabled = false,
  onTogglePopover,
  onColorChange,
}: HighlighterColorPickerProps) {
  return (
    <div className="text-formatting-color-picker">
      <button
        className="text-formatting-color-picker-button"
        aria-label="Highlight color"
        title="Highlight color"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onTogglePopover(isOpen ? null : "highlightColor")}
      >
        <span
          className={`text-formatting-color-picker-letter is-highlight${color ? "" : " is-empty"}`}
          style={{ "--picker-color": color } as React.CSSProperties}
        >
          A
        </span>
      </button>

      {isOpen && (
        <div className="text-formatting-color-picker-menu">
          <h4 className="text-formatting-color-picker-menu-header">
            Select a highlight color
          </h4>
          <button
            className="text-formatting-color-picker-none"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onColorChange("");
              onTogglePopover(null);
            }}
          >
            None
          </button>
          <div className="text-formatting-color-picker-grid">
            {COLORS.flat().map((c) => (
              <button
                key={c}
                className={`text-formatting-color-picker-option${c === color ? " is-selected" : ""}`}
                style={{ "--option-color": c } as React.CSSProperties}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onColorChange(c);
                  onTogglePopover(null);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
