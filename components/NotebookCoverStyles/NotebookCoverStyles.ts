import type { NotebookCoverStyle } from "@/types/Notebook";
import "./RedCover.css";
import "./BlueCover.css";
import "./GreenCover.css";

type NotebookCoverStyleDefinition = {
  label: string;
  className: string; // Sets the front and inside backgrounds for anything inside it
};

// Every cover style the app offers, in the order the template tiles show them
export const NOTEBOOK_COVER_STYLES: Record<
  NotebookCoverStyle,
  NotebookCoverStyleDefinition
> = {
  red: { label: "Red", className: "red-cover" },
  blue: { label: "Blue", className: "blue-cover" },
  green: { label: "Green", className: "green-cover" },
};
