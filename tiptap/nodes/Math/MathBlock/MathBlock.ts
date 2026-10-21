import type { MathBlockAttrs } from "../MathType";
import { MathBlockView } from "./MathBlockView";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import { CreateReactNodeExtension } from "../../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";

// Starting equation and size for a brand-new math block
const defaultMathBlockAttrs = {
  latex: "9 + 10 = 21",
  width: 400,
  height: 40,
  fontSize: 16,
  textColor: DefaultTextFormatState.textColor,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  highlightColor: DefaultTextFormatState.highlightColor,
} satisfies MathBlockAttrs;

// Defines the MathBlock tiptap node (a KaTeX-rendered block equation).
export const MathBlock = CreateReactNodeExtension({
  name: "MathBlock",
  dataType: "math-block",
  defaultAttrs: defaultMathBlockAttrs,
  component: MathBlockView,
  group: "block",
  maxSize: {
    maxWidth: NOTEBOOK_PAGE_WIDTH,
    maxHeight: 100,
  },
  draggable: true,
  toolbarFields: [
    "fontSize",
    "textColor",
    "isBold",
    "isItalic",
    "isUnderline",
    "highlightColor",
  ],
});
