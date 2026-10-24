import type { JSONContent } from "@tiptap/core";
import { TipTapTextRenderer } from "./TipTapTextRenderer";
import { TipTapDiagramBlockRenderer } from "./TipTapDiagramBlockRenderer";
import { TipTapMathBlockRenderer } from "./TipTapMathBlockRenderer";
import { TipTapMathInlineRenderer } from "./TipTapMathInlineRenderer";
import { TipTapMatrixBlockRenderer } from "./TipTapMatrixBlockRenderer";
import { TipTapChemBlockRenderer } from "./TipTapChemBlockRenderer";
import { TipTapCodeBlockRenderer } from "./TipTapCodeBlockRenderer";
import {
  ROW_BOX_CLASS,
  getWrappedBlockAttributes,
  getWrappedColumnAttributes,
  toReactProps,
} from "@/tiptap/nodes/WrappedBlock/WrappedAttributes";
import "@/tiptap/nodes/WrappedBlock/WrappedBlock.css";

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
    case "CodeBlock":
      return <TipTapCodeBlockRenderer node={node} />;
    case "WrappedBlock":
      return (
        <div className={ROW_BOX_CLASS}>
          <div {...toReactProps(getWrappedBlockAttributes(node.attrs ?? {}))}>
            {node.content?.map((child, index) => (
              <TipTapNodeRenderer key={index} node={child} />
            ))}
          </div>
        </div>
      );
    case "WrappedColumn":
      return (
        <div {...toReactProps(getWrappedColumnAttributes(node.attrs ?? {}))}>
          {node.content?.map((child, index) => (
            <TipTapNodeRenderer key={index} node={child} />
          ))}
        </div>
      );
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
