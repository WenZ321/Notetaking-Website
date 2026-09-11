import type { MathAttrs } from "../MathType";
import { MathBlockView } from "./MathBlockView";
import { CreateReactNodeExtension } from "../../ReactNodeFactory";

const defaultMathAttrs = {
  latex: "9 + 10 = 21",
} satisfies MathAttrs;

export const MathBlock = CreateReactNodeExtension({
  name: "MathBlock",
  dataType: "math-block",
  defaultAttrs: defaultMathAttrs,
  component: MathBlockView,
});
