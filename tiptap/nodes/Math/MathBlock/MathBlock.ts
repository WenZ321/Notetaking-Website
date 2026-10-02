import type { MathBlockAttrs } from "../MathType";
import { MathBlockView } from "./MathBlockView";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { CreateReactNodeExtension } from "../../SharedNodeParts/NodeFactory/ReactNodeFactory";

// Starting equation and size for a brand-new math block
const defaultMathBlockAttrs = {
  latex: "9 + 10 = 21",
  width: 400,
  height: 40,
  fontSize: 16,
  textColor: DefaultTextFormatState.textColor,
} satisfies MathBlockAttrs;

// Defines the MathBlock tiptap node (a KaTeX-rendered block equation).
export const MathBlock = CreateReactNodeExtension({
  name: "MathBlock",
  dataType: "math-block",
  defaultAttrs: defaultMathBlockAttrs,
  component: MathBlockView,
  group: "block",
  draggable: true,
  toolbarFields: ["fontSize", "textColor"],
});
