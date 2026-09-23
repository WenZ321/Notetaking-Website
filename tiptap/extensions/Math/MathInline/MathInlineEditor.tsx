import type { RefObject } from "react";
import type { MathfieldElement } from "mathlive";
import { useRef } from "react";
import { MathInlinePopover } from "./MathInlinePopover";
import { useMathfieldClickToPosition } from "../useMathfieldClickToPosition";
import "mathlive";

type Props = {
  latex: string;
  onChange: (latex: string) => void;
  anchorRef: RefObject<HTMLElement | null>;
};

// Live mathlive input for editing inline math in place, with its keyboard
// popover anchored below.
export function MathInlineEditor({ latex, onChange, anchorRef }: Props) {
  const mf = useRef<MathfieldElement | null>(null);

  useMathfieldClickToPosition(mf);

  return (
    <>
      <math-field
        ref={mf}
        onInput={(event) => {
          onChange((event.target as MathfieldElement).value);
        }}
      >
        {latex}
      </math-field>
      <MathInlinePopover anchorRef={anchorRef} mathfieldRef={mf} />
    </>
  );
}
