export type TextFormatState = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
};

export type TextFormattingToolbarPopover =
  | "textColor"
  | "highlightColor"
  | "fontFamily"
  | null;
