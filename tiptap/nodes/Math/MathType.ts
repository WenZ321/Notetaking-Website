// Attrs shape shared by the math node types, with a font size and text
// color for the whole equation
export type MathAttrs = {
  latex: string;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  highlightColor: string; // an empty string means no highlight, the same as for text
};

// Math blocks are resizable, so they also carry a pixel size
export type MathBlockAttrs = MathAttrs & {
  width: number;
  height: number;
};
