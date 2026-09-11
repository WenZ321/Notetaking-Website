import type { PreviewComponentProps } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./MathBlockPreview.css";

export function MathBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<MathAttrs>) {
  return (
    <div className="math-block-preview" onDoubleClick={openEditor}>
      <BlockMath math={node.attrs.latex} />
    </div>
  );
}
