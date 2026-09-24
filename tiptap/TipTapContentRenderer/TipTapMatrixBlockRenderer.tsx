import type { JSONContent } from "@tiptap/core";
import type { MatrixBlockAttrs } from "@/tiptap/extensions/Matrix/MatrixBlockType";
import { BlockMath } from "react-katex";
import { buildMatrixLatex } from "@/tiptap/extensions/Matrix/MatrixBlockLatex";
import "katex/dist/katex.min.css";

// Read-only KaTeX render of a matrix block, straight from its saved attrs
export function TipTapMatrixBlockRenderer({ node }: { node: JSONContent }) {
  const { values } = node.attrs as MatrixBlockAttrs;

  return <BlockMath math={buildMatrixLatex(values)} />;
}
