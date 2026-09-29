import type { MathBlockAttrs } from "../MathType";
import { useLayoutEffect, useRef } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./MathBlockEquation.css";

// Smallest the equation is scaled down before the box stops shrinking
const MIN_ZOOM = 0.5;

type MathBlockEquationProps = {
  attrs: MathBlockAttrs;
  reportMinWidth?: (minWidth: number) => void;
};

// Renders a math block's equation centered in its sized box. Shared between
// the live preview and the static content renderer.
export function MathBlockEquation({
  attrs,
  reportMinWidth,
}: MathBlockEquationProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);

  // The equation wraps first; once its widest unbreakable chunk still
  // doesn't fit, it zooms out, down to MIN_ZOOM
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    let isActive = true;

    const fitToBox = () => {
      if (!isActive) return;

      const chunks = box.querySelectorAll<HTMLElement>(".katex-html > .base");

      // rects include any page scaling above the box, so it's divided back out
      const ancestorScale = box.getBoundingClientRect().width / box.offsetWidth;

      let widestChunk = 0;
      chunks.forEach((chunk) => {
        widestChunk = Math.max(
          widestChunk,
          chunk.getBoundingClientRect().width,
        );
      });

      const naturalChunkWidth = widestChunk / ancestorScale / zoomRef.current;
      if (naturalChunkWidth === 0) return;

      const boxStyle = getComputedStyle(box);
      const padding =
        parseFloat(boxStyle.paddingLeft) + parseFloat(boxStyle.paddingRight);
      const availableWidth = box.clientWidth - padding;

      const zoom = Math.min(
        1,
        Math.max(MIN_ZOOM, availableWidth / naturalChunkWidth),
      );
      const minWidth = Math.ceil(naturalChunkWidth * MIN_ZOOM + padding);

      zoomRef.current = zoom;
      box.style.setProperty("--math-block-zoom", String(zoom));
      box.style.setProperty("--math-block-min-width", `${minWidth}px`);
      reportMinWidth?.(minWidth);
    };

    fitToBox();

    // KaTeX's fonts can finish loading after the first render and change its widths
    document.fonts.ready.then(fitToBox);

    return () => {
      isActive = false;
    };
  }, [attrs.latex, attrs.width, reportMinWidth]);

  return (
    <div
      ref={boxRef}
      className="math-block-equation"
      style={
        {
          "--math-block-width": `${attrs.width}px`,
          "--math-block-height": `${attrs.height}px`,
        } as React.CSSProperties
      }
    >
      <span className="math-block-equation-content">
        {/* KaTeX only line-breaks in inline mode, so displaystyle keeps the
            display-size look while letting long equations wrap */}
        <InlineMath math={`\\displaystyle ${attrs.latex}`} />
      </span>
    </div>
  );
}
