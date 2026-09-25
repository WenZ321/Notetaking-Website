import type { JSONContent } from "@tiptap/core";
import type { ChemAttrs } from "@/tiptap/extensions/Chem/ChemType";
import { ChemEquation } from "@/tiptap/extensions/Chem/ChemEquation";

// Read-only render of a chem block, straight from its saved attrs
export function TipTapChemBlockRenderer({ node }: { node: JSONContent }) {
  return <ChemEquation attrs={node.attrs as ChemAttrs} />;
}
