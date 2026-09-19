import type { EditorComponentProps } from "../ReactNodeViewFactory";
import type { MathAttrs } from "./MathType";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import { TiptapNodeEditor } from "../TiptapNodeView/TiptapNodeEditor";
import {
  MathLiveKeyboard,
  LAYER_OPTIONS,
} from "./MathLiveKeyboard/MathLiveKeyboard";
import { DEFAULT_LAYER_ID } from "./MathLiveKeyboard/MathLiveKeyboardLayerIds";
import "mathlive";
import "./MathEditor.css";

// Editor overlay for a math node (block or inline): a mathlive input field
// with its virtual keyboard. Shared by MathBlock and MathInline - editing
// is identical for both, only the read-only preview differs.
export function MathEditor({
  node,
  updateAttributes,
  closeEditor,
}: EditorComponentProps<MathAttrs>) {
  // edited locally first; only written back to the document on Save
  const [latex, setLatex] = useState(node.attrs.latex);
  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_LAYER_ID);

  const mf = useRef<MathfieldElement | null>(null);
  const keyboardMount = useRef<HTMLDivElement | null>(null);
  const keyboard = useRef<MathLiveKeyboard | null>(null);

  useEffect(() => {
    const mathfield = mf.current;
    const mount = keyboardMount.current;

    if (!mathfield || !mount) return;

    keyboard.current = new MathLiveKeyboard(mathfield);
    keyboard.current.mount(mount);

    return () => {
      keyboard.current?.unmount();
      keyboard.current = null;
    };
  }, []);

  // mathlive doesn't place the cursor where you click, so we manually
  // translate the click position into a cursor offset
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
      backgroundClassName="math-editor-background"
    >
      <div className="math-editor-content">
        <math-field
          ref={mf}
          onInput={(event) => {
            setLatex((event.target as MathfieldElement).value);
          }}
        >
          {latex}
        </math-field>

        <div className="math-editor-keyboard-container">
          <div className="math-live-keyboard-header">
            {LAYER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={
                  "math-live-keyboard-header-button" +
                  (option.id === activeLayerId ? " active" : "")
                }
                onPointerDown={(event) => {
                  event.preventDefault();
                  keyboard.current?.switchLayer(option.id);
                  setActiveLayerId(option.id);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div ref={keyboardMount} className="math-live-keyboard-mount" />
        </div>
      </div>
    </TiptapNodeEditor>
  );
}
