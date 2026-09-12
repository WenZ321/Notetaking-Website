import type { MathAttrs } from "../MathType";
import { MathBlockView } from "./MathBlockView";
import { CreateReactNodeExtension } from "../../ReactNodeFactory";

// Starting equation for a brand-new math block
const defaultMathAttrs = {
  latex: "9 + 10 = 21",
} satisfies MathAttrs;

// Defines the MathBlock tiptap node (a KaTeX-rendered block equation).
export const MathBlock = CreateReactNodeExtension({
  name: "MathBlock",
  dataType: "math-block",
  defaultAttrs: defaultMathAttrs,
  component: MathBlockView,
});
