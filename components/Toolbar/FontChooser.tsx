import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./FontChooser.css";

type FontFamilyProps = {
  defaultFont: string;
  fonts: string[];
  onFontChange: (font: string) => void;
};

export default function FontChooser({
  defaultFont,
  fonts,
  onFontChange,
}: FontFamilyProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chooseFont = (font: string) => {
    onFontChange(font);
    setIsOpen(false);
  };

  return (
    <div className="font-chooser">
      <button
        className="font-chooser-button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="font-chooser-text">{defaultFont}</span>

        <ChevronDown className="font-chooser-arrow" />
      </button>

      {isOpen && (
        <div className="font-chooser-dropdown">
          {fonts.map((font) => (
            <button
              key={font}
              className={`font-option ${font === defaultFont ? "active" : ""}`}
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
