import type { RefObject } from "react";
import { useEffect, useState } from "react";

// Where to draw one underline, in pixels inside the equation's wrapper
export type EquationUnderline = {
  left: number;
  top: number;
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

// One underline per visual line, under its lowest point. A piece that starts
// left of the one before it has wrapped onto a new line
function measureUnderlines(wrapper: HTMLElement): EquationUnderline[] {
  const lines: { left: number; right: number; bottom: number }[] = [];
  let previousLeft = -Infinity;

  wrapper.querySelectorAll<HTMLElement>(PIECE_SELECTOR).forEach((piece) => {
    const { left, top } = offsetWithin(piece, wrapper);
    const right = left + piece.offsetWidth;
    const bottom = top + piece.offsetHeight;
    const line = lines[lines.length - 1];

    if (!line || left < previousLeft) {
      lines.push({ left, right, bottom });
    } else {
      line.left = Math.min(line.left, left);
      line.right = Math.max(line.right, right);
      line.bottom = Math.max(line.bottom, bottom);
    }
    previousLeft = left;
  });

  return lines.map(({ left, right, bottom }) => ({
    left,
    top: bottom,
    width: right - left,
  }));
}

// Measures where to underline a wrapped equation, again whenever its size
// changes, e.g. after a resize or once fonts finish loading
export function useEquationUnderlines(
  wrapperRef: RefObject<HTMLElement | null>,
  isUnderlined: boolean,
): EquationUnderline[] {
  const [underlines, setUnderlines] = useState<EquationUnderline[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !isUnderlined) return;

    let isActive = true;
    const update = () => {
      if (isActive) setUnderlines(measureUnderlines(wrapper));
    };

    // also runs once right away, when it starts watching
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    document.fonts.ready.then(update);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [wrapperRef, isUnderlined]);

  return isUnderlined ? underlines : [];
}
