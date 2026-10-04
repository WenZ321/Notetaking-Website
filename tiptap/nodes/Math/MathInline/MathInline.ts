import type { MathAttrs } from "../MathType";
import { MathInlineView } from "./MathInlineView";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { CreateReactNodeExtension } from "../../SharedNodeParts/NodeFactory/ReactNodeFactory";

// Starting equation for a brand-new inline math node, sized and colored
// like the default text around it
const defaultMathAttrs = {
  latex: "x",
  fontSize: DefaultTextFormatState.fontSize,
  textColor: DefaultTextFormatState.textColor,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  highlightColor: DefaultTextFormatState.highlightColor,
} satisfies MathAttrs;

// Defines the MathInline tiptap node (a KaTeX-rendered inline equation).
export const MathInline = CreateReactNodeExtension({
  name: "MathInline",
  dataType: "math-inline",
  defaultAttrs: defaultMathAttrs,
  component: MathInlineView,
  group: "inline",
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
