import type { MathBlockAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import { FitZoomBox } from "../../SharedNodeParts/BlockNodeUI/FitZoomBox";
import "katex/dist/katex.min.css";

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
  return (
    <FitZoomBox
      width={attrs.width}
      height={attrs.height}
      chunkSelector=".katex-html > .base"
      reportMinWidth={reportMinWidth}
    >
      {/* KaTeX only line-breaks in inline mode, so displaystyle keeps the
          display-size look while letting long equations wrap */}
      <InlineMath math={`\\displaystyle ${attrs.latex}`} />
    </FitZoomBox>
  );
}
