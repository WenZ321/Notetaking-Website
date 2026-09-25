// One base character/run, plus its optional sub/superscript - both can be
// filled in at once (e.g. isotope notation) or left empty
export type ChemUnit = {
  base: string;
  sub: string;
  sup: string;
};

// One chemical species/slot, e.g. "H2O" as a sequence of units
export type ChemSpecies = ChemUnit[];

export type ChemArrow = "yields" | "equilibrium";

// Attrs shape shared by the chem node types.
export type ChemAttrs = {
  reactants: ChemSpecies[];
  products: ChemSpecies[];
  arrow: ChemArrow;
};
