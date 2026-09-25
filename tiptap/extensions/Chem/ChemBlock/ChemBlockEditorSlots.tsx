import type { ChemSpecies } from "../ChemType";
import { ChemSpeciesEditor } from "./ChemSpeciesEditor";

type ChemBlockEditorSlotsProps = {
  species: ChemSpecies[];
  onUpdateSlot: (index: number, species: ChemSpecies) => void;
};

// Just the row of species editors for one side - kept separate from the
// add/remove-slot controls so the equation row (species + arrow) can align
// on its own, independent of the controls below it.
export function ChemBlockEditorSlots({
  species,
  onUpdateSlot,
}: ChemBlockEditorSlotsProps) {
  return (
    <div className="chem-block-editor-slots">
      {species.map((s, index) => (
        <ChemSpeciesEditor
          key={index}
          species={s}
          onChange={(newSpecies) => onUpdateSlot(index, newSpecies)}
        />
      ))}
    </div>
  );
}
