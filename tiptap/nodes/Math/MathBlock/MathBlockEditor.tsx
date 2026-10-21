import type { EditorComponentProps } from "../../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { MathBlockAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useRef, useState } from "react";
import { BlockNodeEditorOverlay } from "../../SharedNodeParts/BlockNodeUI/BlockNodeEditorOverlay";
import { MathLiveKeyboardPanel } from "../MathLiveKeyboardPanel";
import { useMathfieldClickToPosition } from "../UseMathfieldClickToPosition";
import "mathlive";
import "./MathBlockEditor.css";

// Editor overlay for a math block: a mathlive input field with its virtual
// keyboard.
export function MathBlockEditor({
  node,
  updateAttributes,
  closeEditor,
}: EditorComponentProps<MathBlockAttrs>) {
  // edited locally first; only written back to the document on Save
  const [latex, setLatex] = useState(node.attrs.latex);

  const mf = useRef<MathfieldElement | null>(null);

  useMathfieldClickToPosition(mf);

  const handleSave = () => {
    updateAttributes({ latex });
    closeEditor();
  };

  return (
    <BlockNodeEditorOverlay
      closeEditor={handleSave}
      backgroundClassName="math-block-editor-background"
    >
      <div className="math-block-editor-content">
        <math-field
          ref={mf}
          onInput={(event) => {
            setLatex((event.target as MathfieldElement).value);
          }}
        >
          {latex}
        </math-field>

        <div className="math-block-editor-keyboard-container">
          <MathLiveKeyboardPanel mathfieldRef={mf} />
        </div>
      </div>
    </BlockNodeEditorOverlay>
  );
}
