import type { EditorComponentProps } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import { TiptapNodeEditor } from "../../TiptapNodeView/TiptapNodeEditor";
import { MathLiveKeyboard } from "../MathLiveKeyboard/MathLiveKeyboard";
import "mathlive";
import "./MathBlockEditor.css";

// Editor overlay for a math block: a mathlive input field with its virtual keyboard.
export function MathBlockEditor({
  node,
  updateAttributes,
  closeEditor,
}: EditorComponentProps<MathAttrs>) {
  // edited locally first; only written back to the document on Save
  const [latex, setLatex] = useState(node.attrs.latex);

  const mf = useRef<MathfieldElement | null>(null);
  const keyboardContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mathfield = mf.current;
    const container = keyboardContainer.current;

    if (!mathfield || !container) return;

    const keyboard = new MathLiveKeyboard(mathfield);

    keyboard.mount(container);

    return () => keyboard.unmount();
  }, []);

  // mathlive doesn't natively place the cursor where you click, so
  // translate the click position into a cursor offset ourselves
  useEffect(() => {
    const mathfield = mf.current;

    if (!mathfield) return;

    const handlePointerDown = (event: PointerEvent) => {
      const offset = mathfield.getOffsetFromPoint(event.clientX, event.clientY);

      mathfield.position = offset;
      mathfield.focus();
    };

    mathfield.addEventListener("pointerdown", handlePointerDown);

    return () =>
      mathfield.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSave = () => {
    updateAttributes({ latex });
    closeEditor();
  };

  return (
    <TiptapNodeEditor
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

        <div
          ref={keyboardContainer}
          className="math-block-editor-keyboard-container"
        />
      </div>
    </TiptapNodeEditor>
  );
}
