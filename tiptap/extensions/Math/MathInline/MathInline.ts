import type { MathAttrs } from "../MathType";
import { MathInlineView } from "./MathInlineView";
import { CreateReactNodeExtension } from "../../NodeFactory/ReactNodeFactory";

// Starting equation for a brand-new inline math node
const defaultMathAttrs = {
  latex: "x",
} satisfies MathAttrs;

// Defines the MathInline tiptap node (a KaTeX-rendered inline equation).
export const MathInline = CreateReactNodeExtension({
  name: "MathInline",
  dataType: "math-inline",
  defaultAttrs: defaultMathAttrs,
  component: MathInlineView,
  group: "inline",
  draggable: true,
});
