import type { ChangeEvent } from "react";
import type { ChemSpecies, ChemUnit } from "../ChemType";
import "./ChemSpeciesEditor.css";

type ChemSpeciesEditorProps = {
  species: ChemSpecies;
  onChange: (species: ChemSpecies) => void;
};

// One species slot: every unit gets its own base input plus two always-
// available, optional sub/sup slots right next to it - no button needed to
// "unlock" them, like mathlive's exponent slots. Leaving a slot empty just
// means that unit has no sub/superscript.
export function ChemSpeciesEditor({
  species,
  onChange,
}: ChemSpeciesEditorProps) {
  const updateUnit = (index: number, patch: Partial<ChemUnit>) => {
    onChange(
      species.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)),
    );
  };

  const removeUnit = (index: number) => {
    onChange(species.filter((_, i) => i !== index));
  };

  const addUnit = () => {
    onChange([...species, { base: "", sub: "", sup: "" }]);
  };

  return (
    <div className="chem-species-editor">
      <div className="chem-species-editor-units">
        {species.map((unit, index) => (
          <div key={index} className="chem-unit">
            <input
              className="chem-unit-base"
              value={unit.base}
              size={Math.max(unit.base.length, 1)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateUnit(index, { base: e.target.value })
              }
            />

            <div className="chem-unit-scripts">
              <input
                className="chem-unit-script-input"
                placeholder="?"
                value={unit.sup}
                size={Math.max(unit.sup.length, 1)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateUnit(index, { sup: e.target.value })
                }
              />
              <input
                className="chem-unit-script-input"
                placeholder="?"
                value={unit.sub}
                size={Math.max(unit.sub.length, 1)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateUnit(index, { sub: e.target.value })
                }
              />
            </div>

            <button
              type="button"
              className="chem-unit-remove"
              onClick={() => removeUnit(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="chem-species-editor-add"
        onClick={addUnit}
      >
        +
      </button>
    </div>
  );
}
