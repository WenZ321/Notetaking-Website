import type { ChangeEvent } from "react";
import type { EditorComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { ChemArrow, ChemAttrs, ChemSpecies } from "../ChemType";
import { useState } from "react";
import { BlockNodeEditorOverlay } from "../../BlockNodeUI/BlockNodeEditorOverlay";
import { ChemBlockEditorSlots } from "./ChemBlockEditorSlots";
import { ChemBlockEditorSlotControls } from "./ChemBlockEditorSlotControls";
import { useChemSide } from "./useChemSide";
import "./ChemBlockEditor.css";

const ARROW_LABELS: Record<ChemArrow, string> = {
  yields: "→ Yields",
  equilibrium: "⇌ Equilibrium",
};

const ARROWS = Object.keys(ARROW_LABELS) as ChemArrow[];

// A species where every unit was left completely blank
function isEmptySpecies(species: ChemSpecies): boolean {
  return species.every((unit) => !unit.base && !unit.sub && !unit.sup);
}

// Drops blank species added but never filled in, keeping at least one slot
// so the side isn't left with none at all
function cleanSide(species: ChemSpecies[]): ChemSpecies[] {
  const nonEmpty = species.filter((s) => !isEmptySpecies(s));
  return nonEmpty.length > 0 ? nonEmpty : [[]];
}

// Editor overlay for a chem block: add/remove species slots on each side,
// per-slot sub/superscript typing, and an arrow-type picker.
export function ChemBlockEditor({
  node,
  updateAttributes,
  closeEditor,
}: EditorComponentProps<ChemAttrs>) {
  // edited locally first; only written back to the document on Save
  const [reactants, setReactants] = useState<ChemSpecies[]>(
    node.attrs.reactants,
  );
  const [products, setProducts] = useState<ChemSpecies[]>(
    node.attrs.products,
  );
  const [arrow, setArrow] = useState<ChemArrow>(node.attrs.arrow);

  const reactantSide = useChemSide(reactants, setReactants);
  const productSide = useChemSide(products, setProducts);

  const handleArrowChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setArrow(e.target.value as ChemArrow);
  };

  const handleSave = () => {
    updateAttributes({
      reactants: cleanSide(reactants),
      products: cleanSide(products),
      arrow,
    });
    closeEditor();
  };

  return (
    <BlockNodeEditorOverlay
      closeEditor={handleSave}
      backgroundClassName="chem-block-editor-background"
    >
      <div className="chem-block-editor-equation">
        <ChemBlockEditorSlots
          species={reactants}
          onUpdateSlot={reactantSide.updateSlot}
        />

        <select
          className="chem-block-editor-arrow"
          value={arrow}
          onChange={handleArrowChange}
        >
          {ARROWS.map((value) => (
            <option key={value} value={value}>
              {ARROW_LABELS[value]}
            </option>
          ))}
        </select>

        <ChemBlockEditorSlots
          species={products}
          onUpdateSlot={productSide.updateSlot}
        />
      </div>

      <div className="chem-block-editor-controls-row">
        <ChemBlockEditorSlotControls
          label="Reactant"
          canRemove={reactants.length > 1}
          onAdd={reactantSide.addSlot}
          onRemove={reactantSide.removeSlot}
        />
        <ChemBlockEditorSlotControls
          label="Product"
          canRemove={products.length > 1}
          onAdd={productSide.addSlot}
          onRemove={productSide.removeSlot}
        />
      </div>
    </BlockNodeEditorOverlay>
  );
}
