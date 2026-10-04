import type { MathBlockAttrs } from "../MathType";
import { useRef } from "react";
import { InlineMath } from "react-katex";
import { FitZoomBox } from "../../SharedNodeParts/BlockNodeUI/FitZoomBox";
import "katex/dist/katex.min.css";
import { useEquationUnderlines } from "./useEquationUnderlines";
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
  const underlines = useEquationUnderlines(equationRef, attrs.isUnderline);

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
      <span ref={equationRef} className={className}>
        <InlineMath math={`\\displaystyle ${attrs.latex}`} />
        {underlines.map((underline, index) => (
          <span
            key={index}
            className="math-equation-underline"
            style={
              {
                "--underline-left": `${underline.left}px`,
                "--underline-top": `${underline.top}px`,
                "--underline-width": `${underline.width}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </FitZoomBox>
  );
}
