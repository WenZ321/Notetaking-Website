import type { CommandProps } from "@tiptap/core";
import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { MatrixBlockView } from "./MatrixBlockView";
import { CreateReactNodeExtension } from "../NodeFactory/ReactNodeFactory";

// Starting size/content for a brand-new matrix block
const defaultMatrixAttrs: MatrixBlockAttrs = {
  rows: 2,
  cols: 2,
  values: [
    ["", ""],
    ["", ""],
  ],
};

// Builds an empty rows x cols grid of cells
function buildEmptyMatrixValues(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

// Defines the MatrixBlock tiptap node: a grid of per-cell LaTeX values
// rendered as a bracketed matrix.
export const MatrixBlock = CreateReactNodeExtension({
  name: "MatrixBlock",
  dataType: "matrix-block",
  defaultAttrs: defaultMatrixAttrs,
  component: MatrixBlockView,
  group: "block",
  draggable: true,
}).extend({
  addCommands() {
    return {
      ...this.parent?.(),

      // Overrides the factory's default parameterless insert command -
      // matrix blocks need their size picked at insert time
      insertMatrixBlock:
        (rows: number, cols: number) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: "MatrixBlock",
            attrs: {
              rows,
              cols,
              values: buildEmptyMatrixValues(rows, cols),
            },
          });
        },
    };
  },
});
