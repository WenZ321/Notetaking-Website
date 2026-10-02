import type {
  FlowNodeData,
  ConnectionData,
  DiagramBlockAttrs,
  FontInfo,
} from "./DiagramBlockType";
import type { PreviewComponentProps } from "../SharedNodeParts/NodeFactory/ReactNodeViewFactory";
import { DiagramBlockCanvas } from "./DiagramBlockCanvas";
import { getViewport } from "./ViewportGenerator";
import { BlockNodePreview } from "../SharedNodeParts/BlockNodeUI/BlockNodePreview";

// Read-only preview of a diagram block, shown inside the editor when not being edited.
export function DiagramBlockPreview({
  width,
  height,
  node,
  openEditor,
}: PreviewComponentProps<DiagramBlockAttrs>) {
  if (width === undefined || height === undefined) {
    return null;
  }

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
