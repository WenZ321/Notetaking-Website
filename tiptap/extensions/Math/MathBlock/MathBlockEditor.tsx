import type { EditorComponentProps } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import "mathlive";
import "./MathBlockEditor.css";

export function MathBlockEditor({
  node,
  updateAttributes,
  closeEditor,
}: EditorComponentProps<MathAttrs>) {
  const [latex, setLatex] = useState(node.attrs.latex);

  const mf = useRef<MathfieldElement | null>(null);
  const keyboardContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mathfield = mf.current;
    const container = keyboardContainer.current;

    if (!mathfield || !container) return;

    const keyboard = window.mathVirtualKeyboard;

    keyboard.container = container;
    mathfield.mathVirtualKeyboardPolicy = "manual";

    const updateKeyboardHeight = () => {
      const height = keyboard.boundingRect.height;

      if (height > 0) {
        container.style.height = `${height}px`;
      }
    };

    keyboard.addEventListener("geometrychange", updateKeyboardHeight);

    const timeout = window.setTimeout(() => {
      mathfield.focus();
      keyboard.show();
      updateKeyboardHeight();
    }, 0);

    const handlePointerDown = (event: PointerEvent) => {
      const offset = mathfield.getOffsetFromPoint(event.clientX, event.clientY);

      mathfield.position = offset;
      mathfield.focus();
    };

    mathfield.addEventListener("pointerdown", handlePointerDown);

    return () => {
      mathfield.removeEventListener("pointerdown", handlePointerDown);
      window.clearTimeout(timeout);
      keyboard.removeEventListener("geometrychange", updateKeyboardHeight);

      keyboard.hide();
      keyboard.container = document.body;
    };
  }, []);

  const handleSave = () => {
    updateAttributes({ latex });
    closeEditor();
  };

  return (
    <div className="math-block-editor-overlay">
      <div className="math-block-editor-background">
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

        <button type="button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
