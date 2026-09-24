import type { PreviewComponentProps } from "../NodeFactory/ReactNodeViewFactory";
import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { BlockMath } from "react-katex";
import { BlockNodePreview } from "../BlockNodeUI/BlockNodePreview";
import { buildMatrixLatex } from "./MatrixBlockLatex";
import "katex/dist/katex.min.css";
import "./MatrixBlockPreview.css";

// Read-only KaTeX rendering of a matrix block, shown when not being edited.
export function MatrixBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<MatrixBlockAttrs>) {
  return (
    <BlockNodePreview openEditor={openEditor} className="matrix-block-preview">
      <BlockMath math={buildMatrixLatex(node.attrs.values)} />
    </BlockNodePreview>
  );
}
