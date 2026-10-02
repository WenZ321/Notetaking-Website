import type { JSONContent } from "@tiptap/core";
import type { MathAttrs } from "@/tiptap/nodes/Math/MathType";
import { MathInlineEquation } from "@/tiptap/nodes/Math/MathInline/MathInlineEquation";

// Read-only KaTeX render of an inline math node, straight from its saved attrs
export function TipTapMathInlineRenderer({ node }: { node: JSONContent }) {
  return <MathInlineEquation attrs={node.attrs as MathAttrs} />;
}
