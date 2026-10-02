import type { ChemBlockAttrs } from "./ChemType";
import { ChemSpeciesText } from "./ChemSpeciesText";
import { FitZoomBox } from "../SharedNodeParts/BlockNodeUI/FitZoomBox";
import "./ChemEquation.css";

const ARROW_SYMBOL: Record<ChemBlockAttrs["arrow"], string> = {
  yields: "→",
  equilibrium: "⇌",
};

type ChemEquationProps = {
  attrs: ChemBlockAttrs;
  reportMinWidth?: (minWidth: number) => void;
};

// Renders a full reactants -> products chemical equation centered in its
// sized box. Shared between the live preview and the static content renderer.
export function ChemEquation({ attrs, reportMinWidth }: ChemEquationProps) {
  return (
    <FitZoomBox
      width={attrs.width}
      height={attrs.height}
      chunkSelector=".chem-equation-species, .chem-equation-arrow"
      reportMinWidth={reportMinWidth}
    >
      <span className="chem-equation">
        {attrs.reactants.map((species, index) => (
          <span key={index}>
            {index > 0 && <span className="chem-equation-plus"> + </span>}
            <span className="chem-equation-species">
              <ChemSpeciesText species={species} />
            </span>
          </span>
        ))}

        <span className="chem-equation-arrow">
          {" "}
          {ARROW_SYMBOL[attrs.arrow]}{" "}
        </span>

        {attrs.products.map((species, index) => (
          <span key={index}>
            {index > 0 && <span className="chem-equation-plus"> + </span>}
            <span className="chem-equation-species">
              <ChemSpeciesText species={species} />
            </span>
          </span>
        ))}
      </span>
    </FitZoomBox>
  );
}
