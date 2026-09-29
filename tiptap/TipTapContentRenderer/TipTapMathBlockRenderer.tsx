import type { JSONContent } from "@tiptap/core";
import type { MathBlockAttrs } from "@/tiptap/extensions/Math/MathType";
import { MathBlockEquation } from "@/tiptap/extensions/Math/MathBlock/MathBlockEquation";

// Read-only KaTeX render of a math block, straight from its saved attrs
export function TipTapMathBlockRenderer({ node }: { node: JSONContent }) {
  return <MathBlockEquation attrs={node.attrs as MathBlockAttrs} />;
}
