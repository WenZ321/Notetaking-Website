import { useState } from "react";
import { Highlighter } from "lucide-react";
import { COLORS } from "@/constants/textFormattingConstants";
import "./TextFormattingColorPicker.css";

type HighlighterColorPickerProps = {
  color: string;
  onColorChange: (color: string) => void;
};

/**
 * Allows users to select a highlight color for text formatting.
 * Displays a button with a highlighter icon and the currently selected color.
 */
export default function HighlighterColorPicker({
  color,
  onColorChange,
}: HighlighterColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-formatting-color-picker">
      <button
        className="text-formatting-color-picker-button"
        onClick={() => setOpen((prev) => !prev)}
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

      {open && (
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
