import type { PreviewComponentProps } from "../../SharedNodeParts/NodeFactory/ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./MathInlinePreview.css";

// Read-only KaTeX rendering of an inline math node's current value.
export function MathInlinePreview({ node }: PreviewComponentProps<MathAttrs>) {
  return <InlineMath math={node.attrs.latex} />;
}
