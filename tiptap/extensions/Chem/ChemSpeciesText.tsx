import type { ChemSpecies } from "./ChemType";
import "./ChemSpeciesText.css";

type ChemSpeciesTextProps = {
  species: ChemSpecies;
};

// Renders one chemical species (a run of units), each with its own optional
// sub/superscript stacked to its right
export function ChemSpeciesText({ species }: ChemSpeciesTextProps) {
  return (
    <>
      {species.map((unit, index) => (
        <span key={index} className="chem-unit-text">
          {unit.base}
          {(unit.sup || unit.sub) && (
            <span className="chem-unit-text-scripts">
              {/* both slots always render, so a lone script still sits high or low */}
              <span className="chem-unit-text-script">{unit.sup}</span>
              <span className="chem-unit-text-script">{unit.sub}</span>
            </span>
          )}
        </span>
      ))}
    </>
  );
}
