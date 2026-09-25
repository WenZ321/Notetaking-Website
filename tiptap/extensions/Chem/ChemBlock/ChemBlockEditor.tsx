import type { ChangeEvent } from "react";
import type { EditorComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { ChemArrow, ChemAttrs, ChemSpecies } from "../ChemType";
import { useState } from "react";
import { BlockNodeEditorOverlay } from "../../BlockNodeUI/BlockNodeEditorOverlay";
import { ChemBlockEditorSide } from "./ChemBlockEditorSide";
import "./ChemBlockEditor.css";

const ARROW_LABELS: Record<ChemArrow, string> = {
  yields: "→ Yields",
  equilibrium: "⇌ Equilibrium",
};

const ARROWS = Object.keys(ARROW_LABELS) as ChemArrow[];

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

  const handleArrowChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setArrow(e.target.value as ChemArrow);
  };

  const handleSave = () => {
    updateAttributes({ reactants, products, arrow });
    closeEditor();
  };

  return (
    <BlockNodeEditorOverlay
      closeEditor={handleSave}
      backgroundClassName="chem-block-editor-background"
    >
      <div className="chem-block-editor-equation">
        <ChemBlockEditorSide
          label="Reactant"
          species={reactants}
          onChange={setReactants}
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

        <ChemBlockEditorSide
          label="Product"
          species={products}
          onChange={setProducts}
        />
      </div>
    </BlockNodeEditorOverlay>
  );
}
