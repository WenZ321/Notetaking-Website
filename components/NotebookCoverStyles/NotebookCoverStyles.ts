import type { NotebookCoverStyle } from "@/types/Notebook";
import "./RedCover.css";
import "./BlueCover.css";
import "./GreenCover.css";
import "./YellowCover.css";
import "./PurpleCover.css";
import "./OrangeCover.css";
import "./TealCover.css";
import "./PinkCover.css";
import "./BrownCover.css";
import "./GrayCover.css";
import "./LavenderCover.css";
import "./MintCover.css";

type NotebookCoverStyleDefinition = {
  label: string;
  className: string; // Sets the front, inside and spine backgrounds for anything inside it
};

// Every cover style the app offers, in the order the template tiles show them
export const NOTEBOOK_COVER_STYLES: Record<
  NotebookCoverStyle,
  NotebookCoverStyleDefinition
> = {
  red: { label: "Red", className: "red-cover" },
  blue: { label: "Blue", className: "blue-cover" },
  green: { label: "Green", className: "green-cover" },
  yellow: { label: "Yellow", className: "yellow-cover" },
  purple: { label: "Purple", className: "purple-cover" },
  orange: { label: "Orange", className: "orange-cover" },
  teal: { label: "Teal", className: "teal-cover" },
  pink: { label: "Pink", className: "pink-cover" },
  brown: { label: "Brown", className: "brown-cover" },
  gray: { label: "Gray", className: "gray-cover" },
  lavender: { label: "Lavender", className: "lavender-cover" },
  mint: { label: "Mint", className: "mint-cover" },
};
