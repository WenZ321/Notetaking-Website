import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { BlockMath } from "react-katex";
import { FitZoomBox } from "../SharedNodeParts/BlockNodeUI/FitZoomBox";
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
      <div className="matrix-block-grid">
        <BlockMath math={buildMatrixLatex(attrs.values)} />
      </div>
    </FitZoomBox>
  );
}
