// Shared types describing the toolbar's text formatting state and which popover is open.
export type TextFormatState = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
};

// One toolbar setting, e.g. fontSize
export type ToolbarField = keyof TextFormatState;

// The toolbar's values for the current selection. A setting the selection
// doesn't have is null, and its control is disabled
export type ToolbarFormatState = {
  [Field in ToolbarField]: TextFormatState[Field] | null;
};

export type TextFormattingToolbarPopover =
  | "textColor"
  | "highlightColor"
  | "fontFamily"
  | null;
