import type { TextFormattingToolbarPopover } from "@/types/textFormatting";
import { COLORS } from "@/constants/textFormattingConstants";
import { Highlighter } from "lucide-react";
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
 * Displays a button with a highlighter icon and the currently selected color.
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
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onTogglePopover(isOpen ? null : "highlightColor")}
      >
        <div className="text-formatting-color-picker-logo">
          <Highlighter />
          <span
            className="text-formatting-color-picker-underline"
            style={{
              backgroundColor: color,
              visibility: color ? "visible" : "hidden",
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="text-formatting-color-picker-menu">
          <h4 className="text-formatting-color-picker-menu-header">
            Select a highlight color
          </h4>
          <div className="text-formatting-color-picker-grid">
            {COLORS.flat().map((c) => (
              <button
                key={c}
                className="text-formatting-color-picker-option"
                style={{
                  backgroundColor: c,
                  border: `2px solid color-mix(in srgb, ${c} 70%, black)`,
                  outline:
                    c === color ? "3px solid blue" : "3px solid transparent",
                }}
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
