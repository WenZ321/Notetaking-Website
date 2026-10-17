import type { TextFormattingToolbarPopover } from "@/types/textFormatting";
import { COLORS } from "@/constants/textFormattingConstants";
import "./TextFormattingColorPicker.css";

type TextColorPickerProps = {
  color: string;
  isOpen: boolean;
  disabled?: boolean;
  onTogglePopover: (popover: TextFormattingToolbarPopover) => void;
  onColorChange: (color: string) => void;
};

/**
 * Allows users to select a text color for text formatting.
 * Displays a button with the letter "A" and the currently selected color.
 */
export function TextColorPicker({
  color,
  isOpen,
  disabled = false,
  onTogglePopover,
  onColorChange,
}: TextColorPickerProps) {
  return (
    <div className="text-formatting-color-picker">
      <button
        className="text-formatting-color-picker-button"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onTogglePopover(isOpen ? null : "textColor");
        }}
      >
        <div className="text-formatting-color-picker-logo">
          <span className="text-color-letter">A</span>
          <span
            className="text-formatting-color-picker-underline"
            style={{ "--picker-color": color } as React.CSSProperties}
          />
        </div>
      </button>

      {isOpen && (
        <div className="text-formatting-color-picker-menu">
          <h4 className="text-formatting-color-picker-menu-header">
            Select a text color
          </h4>
          <div className="text-formatting-color-picker-grid">
            {/* c here represents a color in the COLORS array */}
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
