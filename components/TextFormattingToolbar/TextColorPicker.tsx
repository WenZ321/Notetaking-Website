import { useState } from "react";
import { COLORS } from "@/constants/textFormattingConstants";
import "./TextFormattingColorPicker.css";

type TextColorPickerProps = {
  color: string;
  onColorChange: (color: string) => void;
};

/**
 * Allows users to select a text color for text formatting.
 * Displays a button with the letter "A" and the currently selected color.
 */
export default function TextColorPicker({
  color,
  onColorChange,
}: TextColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-formatting-color-picker">
      <button
        className="text-formatting-color-picker-button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="text-formatting-color-picker-logo">
          <span className="text-color-letter">A</span>
          <span
            className="text-formatting-color-picker-underline"
            style={{ backgroundColor: color }}
          />
        </div>
      </button>

      {open && (
        <div className="text-formatting-color-picker-menu">
          <h4 className="text-formatting-color-picker-menu-header">
            Select a text color
          </h4>
          <div className="text-formatting-color-picker-grid">
            {/* c here represents a color in the COLORS array */}
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
                onClick={() => {
                  onColorChange(c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
