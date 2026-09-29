// Attrs shape for the matrix block: one LaTeX string per cell, row-major,
// plus the block's pixel size since it's resizable.
export type MatrixBlockAttrs = {
  rows: number;
  cols: number;
  values: string[][];
  width: number;
  height: number;
};
