import type { JSONContent } from "@tiptap/core";
import type { ChemBlockAttrs } from "@/tiptap/nodes/Chem/ChemType";
import { ChemEquation } from "@/tiptap/nodes/Chem/ChemEquation";

// Read-only render of a chem block, straight from its saved attrs
export function TipTapChemBlockRenderer({ node }: { node: JSONContent }) {
  return <ChemEquation attrs={node.attrs as ChemBlockAttrs} />;
}
