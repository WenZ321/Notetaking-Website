import type { PreviewComponentProps } from "../../SharedNodeParts/NodeFactory/ReactNodeViewFactory";
import type { ChemBlockAttrs } from "../ChemType";
import { BlockNodePreview } from "../../SharedNodeParts/BlockNodeUI/BlockNodePreview";
import { ChemEquation } from "../ChemEquation";
import "./ChemBlockPreview.css";

// Read-only rendering of a chem block, shown when not being edited.
export function ChemBlockPreview({
  node,
  openEditor,
  reportMinWidth,
  reportMinHeight,
}: PreviewComponentProps<ChemBlockAttrs>) {
  return (
    <BlockNodePreview openEditor={openEditor} className="chem-block-preview">
      <ChemEquation
        attrs={node.attrs}
        reportMinWidth={reportMinWidth}
        reportMinHeight={reportMinHeight}
      />
    </BlockNodePreview>
  );
}
