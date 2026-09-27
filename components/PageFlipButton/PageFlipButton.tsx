import { ChevronLeft, ChevronRight } from "lucide-react";
import "./PageFlipButton.css";

type PageFlipButtonProps = {
  direction: "previous" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
};

// Arrow button for moving between notebook pages
export function PageFlipButton({
  direction,
  label,
  disabled,
  onClick,
}: PageFlipButtonProps) {
  return (
    <button
      className="page-flip-button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {direction === "previous" ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}
