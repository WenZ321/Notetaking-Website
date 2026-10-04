import type { MathBlockAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import { FitZoomBox } from "../../SharedNodeParts/BlockNodeUI/FitZoomBox";
import { DecoratedEquation } from "../../SharedNodeParts/BlockNodeUI/DecoratedEquation";
import "katex/dist/katex.min.css";
import "../MathEquation.css";

// The pieces KaTeX splits an equation into. A line can only wrap between them
const PIECE_SELECTOR = ".katex-html > .katex-base";

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
      chunkSelector={PIECE_SELECTOR}
      reportMinWidth={reportMinWidth}
      reportMinHeight={reportMinHeight}
      reportMaxHeight={reportMaxHeight}
    >
      {/* KaTeX only line-breaks in inline mode, so displaystyle keeps the
          display-size look while letting long equations wrap */}
      <DecoratedEquation
        pieceSelector={PIECE_SELECTOR}
        isUnderline={attrs.isUnderline}
        highlightColor={attrs.highlightColor}
        className={className}
      >
        <InlineMath math={`\\displaystyle ${attrs.latex}`} />
      </DecoratedEquation>
    </FitZoomBox>
  );
}
