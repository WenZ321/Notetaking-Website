import type { JSONContent } from "@tiptap/core";
import type { DiagramBlockAttrs } from "@/tiptap/nodes/DiagramBlock/DiagramBlockType";
import { DiagramBlockCanvas } from "@/tiptap/nodes/DiagramBlock/DiagramBlockCanvas";
import { getViewport } from "@/tiptap/nodes/DiagramBlock/ViewportGenerator";

// Read-only render of a diagram block, straight from its saved attrs
export function TipTapDiagramBlockRenderer({ node }: { node: JSONContent }) {
  const { width, height, nodes, connections, fontInfo } =
    node.attrs as DiagramBlockAttrs;

  const viewport = getViewport(nodes, width, height);

  return (
    <DiagramBlockCanvas
      mode="preview"
      diagramBlockInfo={{ width, height, nodes, connections, fontInfo }}
      viewport={viewport}
    />
  );
}
