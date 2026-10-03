import { Bold, Underline, Italic } from "lucide-react";
import "./TextStyleToggleButton.css";

type textStyleType = "Bold" | "Italic" | "Underline";

type Props = {
  styleType: textStyleType;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

// Maps a style type to its lucide-react icon
function getIcon(type: textStyleType) {
  switch (type) {
    case "Bold":
      return <Bold />;
    case "Italic":
      return <Italic />;
    case "Underline":
      return <Underline />;
  }
}

/**
 * A button component that toggles a specific text style (bold, italic, or underline) in the editor.
 */
export function TextStyleToggleButton({
  styleType,
  active = false,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        active
          ? "text-formatting-style-toggle-button active"
          : "text-formatting-style-toggle-button"
      }
    >
      {getIcon(styleType)}
    </button>
  );
}
