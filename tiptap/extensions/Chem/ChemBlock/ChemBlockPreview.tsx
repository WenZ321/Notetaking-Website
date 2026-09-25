import type { PreviewComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { ChemAttrs } from "../ChemType";

// Placeholder - replaced with the real segment-based render in a later phase.
export function ChemBlockPreview({
  node,
  openEditor,
}: PreviewComponentProps<ChemAttrs>) {
  return (
    <div onDoubleClick={openEditor}>
      {node.attrs.reactants.length} reactant(s) {node.attrs.arrow}{" "}
      {node.attrs.products.length} product(s)
    </div>
  );
}
