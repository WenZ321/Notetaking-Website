import type { PreviewComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import { BlockMath } from "react-katex";
import { BlockPreview } from "../../BlockNodeUI/BlockPreview";
import "katex/dist/katex.min.css";
import "./MathBlockPreview.css";

// Read-only KaTeX rendering of a math block, shown when not being edited.
export function MathBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<MathAttrs>) {
  return (
    <BlockPreview openEditor={openEditor} className="math-block-preview">
      <BlockMath math={node.attrs.latex} />
    </BlockPreview>
  );
}
