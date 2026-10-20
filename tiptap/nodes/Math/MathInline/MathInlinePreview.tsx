import type { PreviewComponentProps } from "../../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { MathAttrs } from "../MathType";
import { MathInlineEquation } from "./MathInlineEquation";
import "./MathInlinePreview.css";

// Read-only KaTeX rendering of an inline math node's current value.
export function MathInlinePreview({ node }: PreviewComponentProps<MathAttrs>) {
  return <MathInlineEquation attrs={node.attrs} />;
}
