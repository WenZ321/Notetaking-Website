import type { PreviewComponentProps } from "../SharedNodeParts/NodeFactory/ReactNodeViewFactory";
import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { BlockNodePreview } from "../SharedNodeParts/BlockNodeUI/BlockNodePreview";
import { MatrixBlockGrid } from "./MatrixBlockGrid";
import "./MatrixBlockPreview.css";

// Read-only KaTeX rendering of a matrix block, shown when not being edited.
export function MatrixBlockPreview({
  node,
  openEditor,
  reportMinWidth,
}: PreviewComponentProps<MatrixBlockAttrs>) {
  return (
    <BlockNodePreview openEditor={openEditor} className="matrix-block-preview">
      <MatrixBlockGrid attrs={node.attrs} reportMinWidth={reportMinWidth} />
    </BlockNodePreview>
  );
}
