import type { RefObject } from "react";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import {
  MathLiveKeyboard,
  LAYER_OPTIONS,
} from "./MathLiveKeyboard/MathLiveKeyboard";
import { DEFAULT_LAYER_ID } from "./MathLiveKeyboard/MathLiveKeyboardLayerIds";
import "./MathLiveKeyboardPanel.css";

type Props = {
  mathfieldRef: RefObject<MathfieldElement | null>;
};

// The layer-switch header and mathlive virtual keyboard for one math field.
// Shared by MathBlockEditor's modal and MathInlinePopover.
export function MathLiveKeyboardPanel({ mathfieldRef }: Props) {
  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_LAYER_ID);

  const keyboardMount = useRef<HTMLDivElement | null>(null);
  const keyboard = useRef<MathLiveKeyboard | null>(null);

  useEffect(() => {
    const mathfield = mathfieldRef.current;
    const mount = keyboardMount.current;

    if (!mathfield || !mount) return;

    keyboard.current = new MathLiveKeyboard(mathfield);
    keyboard.current.mount(mount);

    return () => {
      keyboard.current?.unmount();
      keyboard.current = null;
    };
  }, [mathfieldRef]);

  return (
    <div className="math-live-keyboard-panel">
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
  );
}
