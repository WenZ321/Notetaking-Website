import type { ChemSpecies } from "../ChemType";
import { ChemSpeciesEditor } from "./ChemSpeciesEditor";

type ChemBlockEditorSideProps = {
  label: string;
  species: ChemSpecies[];
  onChange: (species: ChemSpecies[]) => void;
};

// One side (reactants or products) of the equation: its species slots, plus
// controls to add/remove a slot from the end.
export function ChemBlockEditorSide({
  label,
  species,
  onChange,
}: ChemBlockEditorSideProps) {
  const addSlot = () => {
    onChange([...species, []]);
  };

  const removeSlot = () => {
    if (species.length <= 1) return;
    onChange(species.slice(0, -1));
  };

  const updateSlot = (index: number, newSpecies: ChemSpecies) => {
    onChange(species.map((s, i) => (i === index ? newSpecies : s)));
  };

  return (
    <div className="chem-block-editor-side">
      <div className="chem-block-editor-slots">
        {species.map((s, index) => (
          <ChemSpeciesEditor
            key={index}
            species={s}
            onChange={(newSpecies) => updateSlot(index, newSpecies)}
          />
        ))}
      </div>

      <div className="chem-block-editor-slot-controls">
        <button onClick={addSlot}>+ {label}</button>
        <button onClick={removeSlot} disabled={species.length <= 1}>
          - {label}
        </button>
      </div>
    </div>
  );
}
