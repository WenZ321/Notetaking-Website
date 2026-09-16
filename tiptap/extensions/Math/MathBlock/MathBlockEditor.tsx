import type { EditorComponentProps } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
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

    // mathlive's virtual keyboard is a single global singleton (attached to
    // document.body by default) - redirect it into our own container and
    // take manual control so it behaves like it belongs to this overlay
    const keyboard = window.mathVirtualKeyboard;

    keyboard.container = container;
    mathfield.mathVirtualKeyboardPolicy = "manual";

    // the keyboard's own height can change (e.g. switching number/symbol
    // layers), so keep the container sized to match instead of clipping it
    // or leaving dead space
    const updateKeyboardHeight = () => {
      const height = keyboard.boundingRect.height;

      if (height > 0) {
        container.style.height = `${height}px`;
      }
    };

    keyboard.addEventListener("geometrychange", updateKeyboardHeight);

    // deferred by one tick: <math-field> is a custom element that needs a
    // moment to finish initializing after mounting, so calling focus()/show()
    // immediately can silently no-op or read a 0 height before layout settles
    const timeout = window.setTimeout(() => {
      mathfield.focus();
      keyboard.show();
      updateKeyboardHeight();
    }, 0);

    // mathlive doesn't natively place the cursor where you click, so
    // translate the click position into a cursor offset ourselves
    const handlePointerDown = (event: PointerEvent) => {
      const offset = mathfield.getOffsetFromPoint(event.clientX, event.clientY);

      mathfield.position = offset;
      mathfield.focus();
    };

    mathfield.addEventListener("pointerdown", handlePointerDown);

    return () => {
      mathfield.removeEventListener("pointerdown", handlePointerDown);
      // cancel the deferred focus/show if we unmount before it fires, so it
      // never runs against a container that's already being torn down
      window.clearTimeout(timeout);
      keyboard.removeEventListener("geometrychange", updateKeyboardHeight);

      // restore the keyboard singleton to its default global state so the
      // next math block edited elsewhere isn't left pointing at a stale container
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
