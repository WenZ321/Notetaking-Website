import { Bold, Underline, Italic } from "lucide-react";
import "./TextStyleToggleButton.css";

type textStyleType = "Bold" | "Italic" | "Underline";

type Props = {
  styleType: textStyleType;
  active: boolean;
  onClick: () => void;
};

function getIcon(type: textStyleType): React.ElementType {
  switch (type) {
    case "Bold":
      return Bold;
    case "Italic":
      return Italic;
    case "Underline":
      return Underline;
  }
}

/**
 * A button component that toggles a specific text style (bold, italic, or underline) in the editor.
 */
export default function TextStyleToggleButton({
  styleType,
  active = false,
  onClick,
}: Props) {
  const Icon = getIcon(styleType);
  return (
    <button
      onClick={onClick}
      className={
        active ? "text-style-toggle-button active" : "text-style-toggle-button"
      }
    >
      <Icon />
    </button>
  );
}
