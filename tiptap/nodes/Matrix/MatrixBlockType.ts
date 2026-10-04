// Attrs shape for the matrix block: one LaTeX string per cell, row-major,
// plus the block's pixel size since it's resizable, and text formatting for
// the whole block. An empty highlight color means none
export type MatrixBlockAttrs = {
  rows: number;
  cols: number;
  values: string[][];
  width: number;
  height: number;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  highlightColor: string;
};
