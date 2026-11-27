import "./TextStyleToggleButton.css";

type textStyleType = "Bold" | "Italic" | "Underline";

type Props = {
  styleType: textStyleType;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

// Maps a style type to its handwritten letter, drawn the way the style looks
function getLetter(type: textStyleType) {
  switch (type) {
    case "Bold":
      return <span className="text-formatting-style-letter is-bold">B</span>;
    case "Italic":
      return <span className="text-formatting-style-letter is-italic">I</span>;
    case "Underline":
      return (
        <span className="text-formatting-style-letter is-underline">
          U
          {/* A wobbly hand-drawn line under the U */}
          <svg viewBox="0 0 30 6" preserveAspectRatio="none" aria-hidden>
            <path d="M1 3c4-2 7 2 11 0s7-2 11 0 5 1 6 0" />
          </svg>
        </span>
      );
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
      aria-label={styleType}
      aria-pressed={active}
      data-tip={styleType}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        active
          ? "text-formatting-style-toggle-button active"
          : "text-formatting-style-toggle-button"
      }
    >
      {getLetter(styleType)}
    </button>
  );
}
