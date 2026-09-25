import type { JSONContent } from "@tiptap/core";
import { TipTapTextRenderer } from "./TipTapTextRenderer";
import { TipTapDiagramBlockRenderer } from "./TipTapDiagramBlockRenderer";
import { TipTapMathBlockRenderer } from "./TipTapMathBlockRenderer";
import { TipTapMathInlineRenderer } from "./TipTapMathInlineRenderer";
import { TipTapMatrixBlockRenderer } from "./TipTapMatrixBlockRenderer";
import { TipTapChemBlockRenderer } from "./TipTapChemBlockRenderer";

type TipTapNodeRendererProps = {
  node: JSONContent;
};

export function TipTapNodeRenderer({ node }: TipTapNodeRendererProps) {
  switch (node.type) {
    case "paragraph":
      return <p>{renderTextContent(node.content)}</p>;
    case "DiagramBlock":
      return <TipTapDiagramBlockRenderer node={node} />;
    case "MathBlock":
      return <TipTapMathBlockRenderer node={node} />;
    case "MatrixBlock":
      return <TipTapMatrixBlockRenderer node={node} />;
    case "ChemBlock":
      return <TipTapChemBlockRenderer node={node} />;
    default:
      return null;
  }
}

// Renders a node's inline children: text (with their marks applied), plus
// any inline atom nodes like MathInline
function renderTextContent(content: JSONContent[] | undefined) {
  return content?.map((child, index) => {
    if (child.type === "MathInline") {
      return <TipTapMathInlineRenderer key={index} node={child} />;
    }

    return <TipTapTextRenderer key={index} node={child} />;
  });
}
