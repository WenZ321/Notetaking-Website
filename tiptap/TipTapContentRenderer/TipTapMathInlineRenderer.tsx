import type { JSONContent } from "@tiptap/core";
import type { MathAttrs } from "@/tiptap/extensions/Math/MathType";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// Read-only KaTeX render of an inline math node, straight from its saved attrs
export function TipTapMathInlineRenderer({ node }: { node: JSONContent }) {
  const { latex } = node.attrs as MathAttrs;

  return <InlineMath math={latex} />;
}
