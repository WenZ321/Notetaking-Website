import type { EditorComponentProps } from "../../SharedNodeParts/NodeFactory/ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useRef, useState } from "react";
import { MathInlinePopover } from "./MathInlinePopover";
import { useMathfieldClickToPosition } from "../useMathfieldClickToPosition";
import { useCloseOnOutsideClick } from "../../SharedNodeParts/useCloseOnOutsideClick";
import "mathlive";
import "./MathInlineEditor.css";

// Live mathlive input for editing inline math in place, with its keyboard
// popover anchored below.
export function MathInlineEditor({
  node,
  updateAttributes,
  closeEditor,
  anchorRef,
}: EditorComponentProps<MathAttrs>) {
  const [latex, setLatex] = useState(node.attrs.latex);
  const mf = useRef<MathfieldElement | null>(null);

  useMathfieldClickToPosition(mf);

  const save = () => {
    updateAttributes({ latex });
    closeEditor();
  };

  useCloseOnOutsideClick(anchorRef, save);

  return (
    <>
      <math-field
        ref={mf}
        onInput={(event) => {
          setLatex((event.target as MathfieldElement).value);
        }}
      >
        {latex}
      </math-field>

      {anchorRef && <MathInlinePopover anchorRef={anchorRef} mathfieldRef={mf} />}
    </>
  );
}
