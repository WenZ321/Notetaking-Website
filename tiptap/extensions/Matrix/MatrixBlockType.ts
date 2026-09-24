// Attrs shape for the matrix block: one LaTeX string per cell, row-major.
export type MatrixBlockAttrs = {
  rows: number;
  cols: number;
  values: string[][];
};
