import type { RefObject } from "react";
import type { MathfieldElement } from "mathlive";
import { useLayoutEffect, useState } from "react";
import { MathLiveKeyboardPanel } from "../MathLiveKeyboardPanel";
import "./MathInlinePopover.css";

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  mathfieldRef: RefObject<MathfieldElement | null>;
};

type Position = { left: number; top: number };

// Popover keyboard for editing inline math
export function MathInlinePopover({ anchorRef, mathfieldRef }: Props) {
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();

    if (rect) setPosition({ left: rect.left, top: rect.bottom + 6 });
  }, [anchorRef]);

  if (!position) return null;

  return (
    <div
      className="math-inline-popover"
      style={
        {
          "--popover-left": `${position.left}px`,
          "--popover-top": `${position.top}px`,
        } as React.CSSProperties
      }
      // stops clicks here from triggering the outside-click close listener
      onPointerDown={(event) => event.stopPropagation()}
    >
      <MathLiveKeyboardPanel mathfieldRef={mathfieldRef} />
    </div>
  );
}
