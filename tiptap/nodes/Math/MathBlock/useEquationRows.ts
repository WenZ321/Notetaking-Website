import type { RefObject } from "react";
import { useEffect, useState } from "react";

// Where one row of a wrapped equation sits, in pixels from the top left
// of the equation's wrapper
export type EquationRow = {
  left: number;
  top: number;
  bottom: number;
  width: number;
};

// The pieces KaTeX splits an equation into. A line can only wrap between them
const PIECE_SELECTOR = ".katex-html > .katex-base";

// Position of an element inside the wrapper, adding up each step outward
function offsetWithin(element: HTMLElement, wrapper: HTMLElement) {
  let left = 0;
  let top = 0;
  let current: Element | null = element;

  while (current instanceof HTMLElement && current !== wrapper) {
    left += current.offsetLeft;
    top += current.offsetTop;
    current = current.offsetParent;
  }

  return { left, top };
}

// The box around each row, from its highest to its lowest point. A piece that
// starts left of the one before it has wrapped onto a new row
function measureRows(wrapper: HTMLElement): EquationRow[] {
  const rows: { left: number; right: number; top: number; bottom: number }[] =
    [];
  let previousLeft = -Infinity;

  wrapper.querySelectorAll<HTMLElement>(PIECE_SELECTOR).forEach((piece) => {
    const { left, top } = offsetWithin(piece, wrapper);
    const right = left + piece.offsetWidth;
    const bottom = top + piece.offsetHeight;
    const row = rows[rows.length - 1];

    if (!row || left < previousLeft) {
      rows.push({ left, right, top, bottom });
    } else {
      row.left = Math.min(row.left, left);
      row.right = Math.max(row.right, right);
      row.top = Math.min(row.top, top);
      row.bottom = Math.max(row.bottom, bottom);
    }
    previousLeft = left;
  });

  return rows.map(({ left, right, top, bottom }) => ({
    left,
    top,
    bottom,
    width: right - left,
  }));
}

// Measures each row of a wrapped equation, so things like underlines and
// highlights can be drawn per row. Measures again whenever its size changes,
// e.g. after a resize or once fonts finish loading
export function useEquationRows(
  wrapperRef: RefObject<HTMLElement | null>,
  isNeeded: boolean,
): EquationRow[] {
  const [rows, setRows] = useState<EquationRow[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !isNeeded) return;

    let isActive = true;
    const update = () => {
      if (isActive) setRows(measureRows(wrapper));
    };

    // also runs once right away, when it starts watching
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    document.fonts.ready.then(update);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [wrapperRef, isNeeded]);

  return isNeeded ? rows : [];
}
