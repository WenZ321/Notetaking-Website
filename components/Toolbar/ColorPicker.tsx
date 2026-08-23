import { useState } from "react";
import { Highlighter } from "lucide-react";
import { colors } from "@/types/textFormatting";
import "./ColorPicker.css";

type ColorProps = {
  isHighlight: boolean;
  defaultColor: string;
  onColorChange: (color: string) => void;
};

export default function ColorPicker({
  isHighlight,
  defaultColor,
  onColorChange,
}: ColorProps) {
  const [currColor, setColor] = useState(defaultColor);
  const [open, setOpen] = useState(false);

  return (
    <div className="color-picker">
      <button
        className="color-picker-button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {isHighlight ? (
          <div className="highlighter-color-logo">
            <Highlighter />
            <span
              className="highlighter-color-underline"
              style={{
                backgroundColor: currColor,
                visibility: currColor ? "visible" : "hidden",
              }}
            />
          </div>
        ) : (
          <div className="text-color-logo">
            <span className="text-color-letter">A</span>
            <span
              className="text-color-underline"
              style={{ backgroundColor: currColor }}
            />
          </div>
        )}
      </button>

      {open && (
        <div className="color-picker-menu">
          <h4 className="color-picker-menu-header">
            Select a {isHighlight ? "highlight" : "text"} color
          </h4>
          <div className="color-picker-grid">
            {colors.flat().map((color) => (
              <button
                key={color}
                className="color-option"
                style={{
                  backgroundColor: color,
                  border: `2px solid color-mix(in srgb, ${color} 70%, black)`,
                  outline:
                    currColor === color
                      ? "3px solid blue"
                      : "3px solid transparent",
                }}
                onClick={() => {
                  onColorChange(color);
                  setColor(color);
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
