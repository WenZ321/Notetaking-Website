import type { InlineEditorComponentProps } from "../../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { MathAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useRef, useState } from "react";
import { MathInlinePopover } from "./MathInlinePopover";
import { useMathfieldClickToPosition } from "../UseMathfieldClickToPosition";
import { useCloseOnOutsideClick } from "../../SharedNodeParts/UseCloseOnOutsideClick";
import "mathlive";
import "./MathInlineEditor.css";

// Live mathlive input for editing inline math in place, with its keyboard
// popover anchored below.
export function MathInlineEditor({
  node,
  updateAttributes,
  closeEditor,
  anchorRef,
}: InlineEditorComponentProps<MathAttrs>) {
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
        style={
          {
            "--math-inline-font-size": `${node.attrs.fontSize}px`,
            "--math-inline-text-color": node.attrs.textColor,
          } as React.CSSProperties
        }
        onInput={(event) => {
          setLatex((event.target as MathfieldElement).value);
        }}
      >
        {latex}
      </math-field>

      <MathInlinePopover anchorRef={anchorRef} mathfieldRef={mf} />
    </>
  );
}
