import { useState } from "react";
import { COLORS } from "@/constants/textFormattingConstants";
import "./TextFormattingColorPicker.css";

type TextColorPickerProps = {
  defaultColor: string;
  onColorChange: (color: string) => void;
};

/**
 * Allows users to select a text color for text formatting.
 * Displays a button with the letter "A" and the currently selected color.
 */
export default function TextColorPicker({
  defaultColor,
  onColorChange,
}: TextColorPickerProps) {
  const [currColor, setColor] = useState(defaultColor);
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
            style={{ backgroundColor: currColor }}
          />
        </div>
      </button>

      {open && (
        <div className="text-formatting-color-picker-menu">
          <h4 className="text-formatting-color-picker-menu-header">
            Select a text color
          </h4>
          <div className="text-formatting-color-picker-grid">
            {COLORS.flat().map((color) => (
              <button
                key={color}
                className="text-formatting-color-picker-option"
                style={{
                  backgroundColor: color,
                  border: `2px solid color-mix(in srgb, ${color} 70%, black)`,
                  outline:
                    currColor === color
                      ? "3px solid blue"
                      : "3px solid transparent",
                }}
                onClick={() => {
                  setColor(color);
                  onColorChange(color);
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
