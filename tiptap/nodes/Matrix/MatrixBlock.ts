import type { CommandProps } from "@tiptap/core";
import type { MatrixBlockAttrs } from "./MatrixBlockType";
import type { NotebookTemplate } from "@/types/notebook";
import type { MaxBlockSize } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { MatrixBlockView } from "./MatrixBlockView";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { CreateReactNodeExtension } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { snapBlockSizeToPaper } from "../SharedNodeParts/NodeFactory/snapBlockSizeToPaper";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

// Starting size/content for a brand-new matrix block
const defaultMatrixAttrs: MatrixBlockAttrs = {
  rows: 2,
  cols: 2,
  values: [
    ["", ""],
    ["", ""],
  ],
  width: 400,
  height: 64,
  fontSize: 16,
  textColor: DefaultTextFormatState.textColor,
  isBold: false,
  isItalic: false,
  highlightColor: DefaultTextFormatState.highlightColor,
};

// Widest and tallest a matrix block can be, also used by its own insert
const matrixMaxSize: MaxBlockSize = {
  maxWidth: NOTEBOOK_PAGE_WIDTH,
  maxHeight: 400,
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
  maxSize: matrixMaxSize,
  draggable: true,
  // no underline, a line under a bracketed grid looks out of place
  toolbarFields: [
    "fontSize",
    "textColor",
    "isBold",
    "isItalic",
    "highlightColor",
  ],
}).extend({
  addCommands() {
    return {
      ...this.parent?.(),

      // Overrides the factory's default parameterless insert command -
      // matrix blocks need their size picked at insert time
      insertMatrixBlock:
        (rows: number, cols: number, template?: NotebookTemplate) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: "MatrixBlock",
            attrs: snapBlockSizeToPaper(
              {
                ...defaultMatrixAttrs,
                rows,
                cols,
                values: buildEmptyMatrixValues(rows, cols),
              },
              template,
              matrixMaxSize,
            ),
          });
        },
    };
  },
});
