import type { RefObject } from "react";
import type { MathfieldElement } from "mathlive";
import { useEffect } from "react";

// mathlive doesn't place the cursor where you click, so this translates
// the click position into a cursor offset. Pass deps to re-attach after
// the mathfield mounts later than the component holding the ref.
export function useMathfieldClickToPosition(
  mathfieldRef: RefObject<MathfieldElement | null>,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const mathfield = mathfieldRef.current;

    if (!mathfield) return;

    const handlePointerDown = (event: PointerEvent) => {
      const offset = mathfield.getOffsetFromPoint(event.clientX, event.clientY);

      mathfield.position = offset;
      mathfield.focus();
    };

    mathfield.addEventListener("pointerdown", handlePointerDown);

    return () =>
      mathfield.removeEventListener("pointerdown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mathfieldRef, ...deps]);
}
