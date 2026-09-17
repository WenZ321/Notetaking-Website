import type { JSONContent } from "@tiptap/core";
import type { MathAttrs } from "@/tiptap/extensions/Math/MathType";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Read-only KaTeX render of a math block, straight from its saved attrs (no
// live editor/ProseMirror node involved, unlike MathBlockPreview).
export function TipTapMathBlockRenderer({ node }: { node: JSONContent }) {
  const { latex } = node.attrs as MathAttrs;

  return <BlockMath math={latex} />;
}
