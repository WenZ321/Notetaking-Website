import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { MatrixBlockView } from "./MatrixBlockView";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import { CreateReactNodeExtension } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";

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

// Defines the MatrixBlock tiptap node: a grid of per-cell LaTeX values
// rendered as a bracketed matrix.
export const MatrixBlock = CreateReactNodeExtension({
  name: "MatrixBlock",
  dataType: "matrix-block",
  defaultAttrs: defaultMatrixAttrs,
  component: MatrixBlockView,
  group: "block",
  maxSize: {
    maxWidth: NOTEBOOK_PAGE_WIDTH,
    maxHeight: 400,
  },
  draggable: true,
  // no underline, a line under a bracketed grid looks out of place
  toolbarFields: [
    "fontSize",
    "textColor",
    "isBold",
    "isItalic",
    "highlightColor",
  ],
});
