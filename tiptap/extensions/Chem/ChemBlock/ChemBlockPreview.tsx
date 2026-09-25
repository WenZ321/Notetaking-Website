import type { PreviewComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { ChemAttrs } from "../ChemType";
import { BlockNodePreview } from "../../BlockNodeUI/BlockNodePreview";
import { ChemEquation } from "../ChemEquation";
import "./ChemBlockPreview.css";

// Read-only rendering of a chem block, shown when not being edited.
export function ChemBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<ChemAttrs>) {
  return (
    <BlockNodePreview openEditor={openEditor} className="chem-block-preview">
      <ChemEquation attrs={node.attrs} />
    </BlockNodePreview>
  );
}
