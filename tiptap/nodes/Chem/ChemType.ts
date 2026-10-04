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

// Chem blocks are resizable, so they also carry a pixel size, plus text
// formatting for the whole block. An empty highlight color means none
export type ChemBlockAttrs = ChemAttrs & {
  width: number;
  height: number;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  highlightColor: string;
};
