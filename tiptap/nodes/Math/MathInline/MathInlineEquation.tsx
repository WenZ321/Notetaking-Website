import type { MathAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import { DecoratedEquation } from "../../SharedNodeParts/BlockNodeUI/DecoratedEquation";
import "katex/dist/katex.min.css";
import "../MathEquation.css";
import "./MathInlineEquation.css";

type MathInlineEquationProps = {
  attrs: MathAttrs;
};

// Renders an inline equation with its own text formatting. Shared between
// the live preview and the static content renderer.
export function MathInlineEquation({ attrs }: MathInlineEquationProps) {
  const className = [
    "math-equation",
    attrs.isBold ? "bold" : "",
    attrs.isItalic ? "italic" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className="math-inline-equation"
      style={
        {
          "--math-inline-font-size": `${attrs.fontSize}px`,
          "--math-inline-text-color": attrs.textColor,
        } as React.CSSProperties
      }
    >
      <DecoratedEquation
        pieceSelector=".katex-html > .katex-base"
        isUnderline={attrs.isUnderline}
        highlightColor={attrs.highlightColor}
        className={className}
      >
        <InlineMath math={attrs.latex} />
      </DecoratedEquation>
    </span>
  );
}
