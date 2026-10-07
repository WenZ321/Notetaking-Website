import type { ChemBlockAttrs } from "./ChemType";
import { ChemSpeciesText } from "./ChemSpeciesText";
import { FitZoomBox } from "../SharedNodeParts/BlockNodeUI/FitZoomBox";
import { DecoratedEquation } from "../SharedNodeParts/BlockNodeUI/DecoratedEquation";
import "./ChemEquation.css";

// Every visible piece, so the underline and highlight cover the whole row
const ROW_PIECE_SELECTOR =
  ".chem-unit-text, .chem-equation-plus, .chem-equation-arrow";

const ARROW_SYMBOL: Record<ChemBlockAttrs["arrow"], string> = {
  yields: "→",
  equilibrium: "⇌",
};

type ChemEquationProps = {
  attrs: ChemBlockAttrs;
  reportMinWidth?: (minWidth: number) => void;
  reportMinHeight?: (minHeight: number) => void;
};

// Renders a full reactants -> products chemical equation centered in its
// sized box. Shared between the live preview and the static content renderer.
export function ChemEquation({
  attrs,
  reportMinWidth,
  reportMinHeight,
}: ChemEquationProps) {
  const className = [
    "chem-equation",
    attrs.isBold ? "bold" : "",
    attrs.isItalic ? "italic" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FitZoomBox
      width={attrs.width}
      height={attrs.height}
      fontSize={attrs.fontSize}
      textColor={attrs.textColor}
      chunkSelector=".chem-equation-species, .chem-equation-arrow"
      reportMinWidth={reportMinWidth}
      reportMinHeight={reportMinHeight}
    >
      <DecoratedEquation
        pieceSelector={ROW_PIECE_SELECTOR}
        isUnderline={attrs.isUnderline}
        highlightColor={attrs.highlightColor}
        className={className}
      >
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
      </DecoratedEquation>
    </FitZoomBox>
  );
}
