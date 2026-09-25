import type { ChemSpecies } from "./ChemType";

type ChemSpeciesTextProps = {
  species: ChemSpecies;
};

// Renders one chemical species (a run of segments) with its sub/superscripts
export function ChemSpeciesText({ species }: ChemSpeciesTextProps) {
  return (
    <>
      {species.map((segment, index) => {
        if (segment.script === "sub") {
          return <sub key={index}>{segment.text}</sub>;
        }

        if (segment.script === "sup") {
          return <sup key={index}>{segment.text}</sup>;
        }

        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}
