import type { PreviewComponentProps } from "../NodeFactory/ReactNodeViewFactory";
import type { MatrixBlockAttrs } from "./MatrixBlockType";

// Placeholder - replaced with the real KaTeX matrix render in a later phase.
export function MatrixBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<MatrixBlockAttrs>) {
  return (
    <div onDoubleClick={openEditor}>
      {node.attrs.rows}x{node.attrs.cols} matrix
    </div>
  );
}
