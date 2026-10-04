import type { MathBlockAttrs } from "../MathType";
import { useRef } from "react";
import { InlineMath } from "react-katex";
import { FitZoomBox } from "../../SharedNodeParts/BlockNodeUI/FitZoomBox";
import "katex/dist/katex.min.css";
import { useEquationRows } from "./useEquationRows";
import "./MathBlockEquation.css";

type MathBlockEquationProps = {
  attrs: MathBlockAttrs;
  reportMinWidth?: (minWidth: number) => void;
  reportMinHeight?: (minHeight: number) => void;
  reportMaxHeight?: (maxHeight: number) => void;
};

// Renders a math block's equation centered in its sized box. Shared between
// the live preview and the static content renderer.
export function MathBlockEquation({
  attrs,
  reportMinWidth,
  reportMinHeight,
  reportMaxHeight,
}: MathBlockEquationProps) {
  const equationRef = useRef<HTMLSpanElement>(null);
  const hasHighlight = attrs.highlightColor !== "";
  const rows = useEquationRows(equationRef, attrs.isUnderline || hasHighlight);

  const className = [
    "math-equation",
    attrs.isBold ? "bold" : "",
    attrs.isItalic ? "italic" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FitZoomBox
      width={attrs.width}
      height={attrs.height}
      fontSize={attrs.fontSize}
      textColor={attrs.textColor}
      chunkSelector=".katex-html > .katex-base"
      reportMinWidth={reportMinWidth}
      reportMinHeight={reportMinHeight}
      reportMaxHeight={reportMaxHeight}
    >
      {/* KaTeX only line-breaks in inline mode, so displaystyle keeps the
          display-size look while letting long equations wrap */}
      <span
        ref={equationRef}
        className={className}
        style={
          {
            "--math-highlight-color": attrs.highlightColor,
          } as React.CSSProperties
        }
      >
        <InlineMath math={`\\displaystyle ${attrs.latex}`} />
        {rows.map((row, index) => (
          // each row's box, read by its highlight and underline
          <span
            key={index}
            style={
              {
                "--row-left": `${row.left}px`,
                "--row-top": `${row.top}px`,
                "--row-bottom": `${row.bottom}px`,
                "--row-width": `${row.width}px`,
              } as React.CSSProperties
            }
          >
            {hasHighlight && <span className="math-equation-highlight" />}
            {attrs.isUnderline && <span className="math-equation-underline" />}
          </span>
        ))}
      </span>
    </FitZoomBox>
  );
}
