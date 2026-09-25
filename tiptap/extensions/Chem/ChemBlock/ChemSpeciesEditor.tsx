import type { ChangeEvent } from "react";
import type { ChemScript, ChemSegment, ChemSpecies } from "../ChemType";
import { useState } from "react";
import { ChemSpeciesText } from "../ChemSpeciesText";
import "./ChemSpeciesEditor.css";

type ChemSpeciesEditorProps = {
  species: ChemSpecies;
  onChange: (species: ChemSpecies) => void;
};

const SCRIPT_LABELS: Record<ChemScript, string> = {
  normal: "N",
  sub: "sub",
  sup: "sup",
};

const SCRIPTS = Object.keys(SCRIPT_LABELS) as ChemScript[];

// One species slot: shows its already-committed segments, plus a live text
// input for the run currently being typed, with buttons to switch which
// script (normal/sub/sup) newly typed characters get.
export function ChemSpeciesEditor({
  species,
  onChange,
}: ChemSpeciesEditorProps) {
  const [draftText, setDraftText] = useState("");
  const [draftScript, setDraftScript] = useState<ChemScript>("normal");

  // Folds the in-progress run into the committed segments, merging into the
  // last segment if it already has the same script
  const commitDraft = (): ChemSpecies => {
    if (!draftText) return species;

    const last = species[species.length - 1];

    if (last && last.script === draftScript) {
      const merged: ChemSegment = { ...last, text: last.text + draftText };
      return [...species.slice(0, -1), merged];
    }

    return [...species, { text: draftText, script: draftScript }];
  };

  const setScript = (script: ChemScript) => {
    if (script === draftScript) return;

    onChange(commitDraft());
    setDraftText("");
    setDraftScript(script);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setDraftText(e.target.value);
  };

  const handleBlur = () => {
    if (!draftText) return;
    onChange(commitDraft());
    setDraftText("");
  };

  return (
    <div className="chem-species-editor">
      <div className="chem-species-editor-scripts">
        {SCRIPTS.map((script) => (
          <button
            key={script}
            type="button"
            className={
              "chem-species-editor-script-button" +
              (draftScript === script ? " active" : "")
            }
            onClick={() => setScript(script)}
          >
            {SCRIPT_LABELS[script]}
          </button>
        ))}
      </div>

      <div className="chem-species-editor-content">
        <ChemSpeciesText species={species} />
        <input
          className="chem-species-editor-input"
          value={draftText}
          size={Math.max(draftText.length, 1)}
          onChange={handleInput}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}
