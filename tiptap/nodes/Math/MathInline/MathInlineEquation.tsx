import type { MathAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./MathInlineEquation.css";

type MathInlineEquationProps = {
  attrs: MathAttrs;
};

// Renders an inline equation at its own size and color. Shared between
// the live preview and the static content renderer.
export function MathInlineEquation({ attrs }: MathInlineEquationProps) {
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
      <InlineMath math={attrs.latex} />
    </span>
  );
}
