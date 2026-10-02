import type { ChemBlockAttrs } from "../ChemType";
import { ChemBlockView } from "./ChemBlockView";
import { DefaultTextFormatState } from "@/constants/textFormattingConstants";
import { CreateReactNodeExtension } from "../../SharedNodeParts/NodeFactory/ReactNodeFactory";

// Starting content and size for a brand-new chem block: one empty
// reactant slot, one empty product slot
const defaultChemBlockAttrs: ChemBlockAttrs = {
  reactants: [[]],
  products: [[]],
  arrow: "yields",
  width: 400,
  height: 40,
  fontSize: 20,
  textColor: DefaultTextFormatState.textColor,
};

// Defines the ChemBlock tiptap node: a reactants/products chemical equation
// built from typed segments (with per-segment sub/superscript), not LaTeX.
export const ChemBlock = CreateReactNodeExtension({
  name: "ChemBlock",
  dataType: "chem-block",
  defaultAttrs: defaultChemBlockAttrs,
  component: ChemBlockView,
  group: "block",
  draggable: true,
  toolbarFields: ["fontSize", "textColor"],
});
