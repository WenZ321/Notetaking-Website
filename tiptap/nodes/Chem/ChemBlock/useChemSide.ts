import type { ChemSpecies } from "../ChemType";

// add/remove/update logic for one side (reactants or products) of the
// equation, shared between the slots row and the controls row that render
// it separately
export function useChemSide(
  species: ChemSpecies[],
  onChange: (species: ChemSpecies[]) => void,
) {
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

  return { addSlot, removeSlot, updateSlot };
}
