// A run of characters sharing one script position
export type ChemScript = "normal" | "sub" | "sup";

export type ChemSegment = {
  text: string;
  script: ChemScript;
};

// One chemical species/slot, e.g. "H2O" as a sequence of segments
export type ChemSpecies = ChemSegment[];

export type ChemArrow = "yields" | "equilibrium";

// Attrs shape shared by the chem node types.
export type ChemAttrs = {
  reactants: ChemSpecies[];
  products: ChemSpecies[];
  arrow: ChemArrow;
};
