import type { PreviewComponentProps } from "../../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { MathBlockAttrs } from "../MathType";
import { BlockNodePreview } from "../../SharedNodeParts/BlockNodeUI/BlockNodePreview";
import { MathBlockEquation } from "./MathBlockEquation";
import "./MathBlockPreview.css";

// Read-only KaTeX rendering of a math block, shown when not being edited.
export function MathBlockPreview({
  node,
  openEditor,
  reportMinWidth,
  reportMinHeight,
}: PreviewComponentProps<MathBlockAttrs>) {
  return (
    <BlockNodePreview openEditor={openEditor} className="math-block-preview">
      <MathBlockEquation
        attrs={node.attrs}
        reportMinWidth={reportMinWidth}
        reportMinHeight={reportMinHeight}
      />
    </BlockNodePreview>
  );
}
