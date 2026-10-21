import type {
  FlowNodeData,
  ConnectionData,
  DiagramBlockAttrs,
  FontInfo,
} from "./DiagramBlockType";
import type { BlockPreviewComponentProps } from "../SharedNodeParts/NodeFactory/NodeComponentTypes";
import { DiagramBlockCanvas } from "./DiagramBlockCanvas";
import { getViewport } from "./ViewportGenerator";
import { BlockNodePreview } from "../SharedNodeParts/BlockNodeUI/BlockNodePreview";

// Read-only preview of a diagram block, shown inside the editor when not being edited.
export function DiagramBlockPreview({
  width,
  height,
  node,
  openEditor,
}: BlockPreviewComponentProps<DiagramBlockAttrs>) {
  const nodes: FlowNodeData[] = node.attrs.nodes;
  const connections: ConnectionData[] = node.attrs.connections;
  const fontInfo: FontInfo = node.attrs.fontInfo;
  const viewport = getViewport(nodes, width, height);

  return (
    <BlockNodePreview openEditor={openEditor}>
      <DiagramBlockCanvas
        mode="preview"
        diagramBlockInfo={{
          width,
          height,
          nodes,
          connections,
          fontInfo,
        }}
        viewport={viewport}
      />
    </BlockNodePreview>
  );
}
