import { ChevronDown } from "lucide-react";
import type { TextFormattingToolbarPopover } from "@/types/textFormatting";
import "./TextFontFamilyChooser.css";

type TextFontFamilyChooserProps = {
  font: string;
  fonts: string[];
  isOpen: boolean;
  onTogglePopover: (popover: TextFormattingToolbarPopover) => void;
  onFontChange: (font: string) => void;
};

/**
 * Allows users to select a font family for text formatting.
 * Displays a button with the currently selected font family and a dropdown of available fonts.
 */
export default function TextFontFamilyChooser({
  font,
  fonts,
  isOpen,
  onTogglePopover,
  onFontChange,
}: TextFontFamilyChooserProps) {
  const chooseFont = (f: string) => {
    onFontChange(f);
    onTogglePopover(null);
  };

  return (
    <div className="text-formatting-font-family-chooser">
      <button
        className="text-formatting-font-family-chooser-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onTogglePopover(isOpen ? null : "fontFamily");
        }}
      >
        <span className="text-formatting-font-family-chooser-text">{font}</span>

        <ChevronDown className="text-formatting-font-family-chooser-arrow" />
      </button>

      {isOpen && (
        <div className="text-formatting-font-family-chooser-dropdown">
          {fonts.map((f) => (
            <button
              key={f}
              className={`text-formatting-font-family-chooser-option ${f === font ? "active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => chooseFont(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
