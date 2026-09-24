// Builds a KaTeX bmatrix expression from a grid of per-cell LaTeX values
export function buildMatrixLatex(values: string[][]): string {
  const rows = values.map((row) => row.join(" & "));
  return `\\begin{bmatrix} ${rows.join(" \\\\ ")} \\end{bmatrix}`;
}
