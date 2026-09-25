import type { ChemAttrs } from "../ChemType";
import { ChemBlockView } from "./ChemBlockView";
import { CreateReactNodeExtension } from "../../NodeFactory/ReactNodeFactory";

// Starting content for a brand-new chem block: one empty reactant slot,
// one empty product slot
const defaultChemAttrs: ChemAttrs = {
  reactants: [[]],
  products: [[]],
  arrow: "yields",
};

// Defines the ChemBlock tiptap node: a reactants/products chemical equation
// built from typed segments (with per-segment sub/superscript), not LaTeX.
export const ChemBlock = CreateReactNodeExtension({
  name: "ChemBlock",
  dataType: "chem-block",
  defaultAttrs: defaultChemAttrs,
  component: ChemBlockView,
  group: "block",
  draggable: true,
});
