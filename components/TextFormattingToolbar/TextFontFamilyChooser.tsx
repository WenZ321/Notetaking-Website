import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./TextFontFamilyChooser.css";

type TextFontFamilyChooserProps = {
  defaultFont: string;
  fonts: string[];
  onFontChange: (font: string) => void;
};

/**
 * Allows users to select a font family for text formatting.
 * Displays a button with the currently selected font family and a dropdown of available fonts.
 */
export default function TextFontFamilyChooser({
  defaultFont,
  fonts,
  onFontChange,
}: TextFontFamilyChooserProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chooseFont = (font: string) => {
    onFontChange(font);
    setIsOpen(false);
  };

  return (
    <div className="text-formatting-font-family-chooser">
      <button
        className="text-formatting-font-family-chooser-button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-formatting-font-family-chooser-text">
          {defaultFont}
        </span>

        <ChevronDown className="text-formatting-font-family-chooser-arrow" />
      </button>

      {isOpen && (
        <div className="text-formatting-font-family-chooser-dropdown">
          {fonts.map((font) => (
            <button
              key={font}
              className={`text-formatting-font-family-chooser-option ${font === defaultFont ? "active" : ""}`}
              onClick={() => chooseFont(font)}
            >
              {font}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
