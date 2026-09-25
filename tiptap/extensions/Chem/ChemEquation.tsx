import type { ChemAttrs } from "./ChemType";
import { ChemSpeciesText } from "./ChemSpeciesText";

const ARROW_SYMBOL: Record<ChemAttrs["arrow"], string> = {
  yields: "→",
  equilibrium: "⇌",
};

type ChemEquationProps = {
  attrs: ChemAttrs;
};

// Renders a full reactants -> products chemical equation. Shared between the
// live preview and the static content renderer.
export function ChemEquation({ attrs }: ChemEquationProps) {
  return (
    <span className="chem-equation">
      {attrs.reactants.map((species, index) => (
        <span key={index}>
          {index > 0 && <span className="chem-equation-plus"> + </span>}
          <ChemSpeciesText species={species} />
        </span>
      ))}

      <span className="chem-equation-arrow">
        {" "}
        {ARROW_SYMBOL[attrs.arrow]}{" "}
      </span>

      {attrs.products.map((species, index) => (
        <span key={index}>
          {index > 0 && <span className="chem-equation-plus"> + </span>}
          <ChemSpeciesText species={species} />
        </span>
      ))}
    </span>
  );
}
