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

function ToggleButton({ styleType, active = false, onClick }: Props) {
  const Icon = getIcon(styleType);
  return (
    <button
      onClick={onClick}
      className={active ? "style-toggle-button active" : "style-toggle-button"}
    >
      <Icon />
    </button>
  );
}

export default ToggleButton;
