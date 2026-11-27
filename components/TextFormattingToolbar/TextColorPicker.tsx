import type { TextFormattingToolbarPopover } from "@/types/TextFormatting";
import { COLORS } from "@/constants/TextFormattingConstants";
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
 * Displays a button with an ink blot of the currently selected color.
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
        aria-label="Text color"
        data-tip="Text color"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onTogglePopover(isOpen ? null : "textColor");
        }}
      >
        <span
          className="text-formatting-color-picker-blot"
          style={{ "--picker-color": color } as React.CSSProperties}
        />
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
