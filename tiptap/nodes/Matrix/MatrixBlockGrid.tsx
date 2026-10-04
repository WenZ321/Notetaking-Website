import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { BlockMath } from "react-katex";
import { FitZoomBox } from "../SharedNodeParts/BlockNodeUI/FitZoomBox";
import { DecoratedEquation } from "../SharedNodeParts/BlockNodeUI/DecoratedEquation";
import { buildMatrixLatex } from "./MatrixBlockLatex";
import "katex/dist/katex.min.css";
import "./MatrixBlockGrid.css";

type MatrixBlockGridProps = {
  attrs: MatrixBlockAttrs;
  reportMinWidth?: (minWidth: number) => void;
  reportMinHeight?: (minHeight: number) => void;
  reportMaxHeight?: (maxHeight: number) => void;
};

// Renders a matrix centered in its sized box. Shared between the live
// preview and the static content renderer.
export function MatrixBlockGrid({
  attrs,
  reportMinWidth,
  reportMinHeight,
  reportMaxHeight,
}: MatrixBlockGridProps) {
  const className = [
    "matrix-block-grid",
    attrs.isBold ? "bold" : "",
    attrs.isItalic ? "italic" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // a matrix can't be split across lines, so the whole thing is one chunk
    // and it only ever zooms
    <FitZoomBox
      width={attrs.width}
      height={attrs.height}
      fontSize={attrs.fontSize}
      textColor={attrs.textColor}
      chunkSelector=".katex"
      reportMinWidth={reportMinWidth}
      reportMinHeight={reportMinHeight}
      reportMaxHeight={reportMaxHeight}
    >
      {/* never wraps, so the highlight is always a single row */}
      <DecoratedEquation
        pieceSelector=".katex-html > .katex-base"
        isUnderline={false}
        highlightColor={attrs.highlightColor}
        className={className}
      >
        <BlockMath math={buildMatrixLatex(attrs.values)} />
      </DecoratedEquation>
    </FitZoomBox>
  );
}
