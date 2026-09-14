import type { JSONContent } from "@tiptap/core";
import { TipTapTextRenderer } from "./TipTapTextRenderer";
import { TipTapDiagramBlockRenderer } from "./TipTapDiagramBlockRenderer";

type TipTapNodeRendererProps = {
  node: JSONContent;
};

export function TipTapNodeRenderer({ node }: TipTapNodeRendererProps) {
  switch (node.type) {
    case "paragraph":
      return <p>{renderTextContent(node.content)}</p>;
    case "DiagramBlock":
      return <TipTapDiagramBlockRenderer node={node} />;
    default:
      return null;
  }
}

// Renders a node's inline text children (with their marks applied)
function renderTextContent(content: JSONContent[] | undefined) {
  return content?.map((child, index) => (
    <TipTapTextRenderer key={index} node={child} />
  ));
}
