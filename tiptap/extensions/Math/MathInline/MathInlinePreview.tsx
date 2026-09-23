import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// Read-only KaTeX rendering of an inline math node's current value.
export function MathInlinePreview({ latex }: { latex: string }) {
  return <InlineMath math={latex} />;
}
