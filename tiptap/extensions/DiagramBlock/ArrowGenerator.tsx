import type {
  FlowNodeData,
  ConnectionData,
  ConnectionPoint,
} from "./DiagramBlockType";
import { Arrow, Line } from "react-konva";
import { getNodeSize } from "./ShapeUtils";

type ArrowProps = {
  nodes: FlowNodeData[]; // All existing flow nodes in the diagram block
  connection: ConnectionData; // The two connection points
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Generates the (x,y) coordinate given a connection point
 * @param nodes All existing nodes
 * @param connector Connection point of a node
 * @returns (x,y) coordinates of a connection point
 */
function getPoint(nodes: FlowNodeData[], connector: ConnectionPoint) {
  const node = nodes.find((n) => n.id === connector.nodeId);
  if (!node) return null;

  const nodeSize = getNodeSize(node.shapeInfo);

  switch (connector.connectorSide) {
    case "Left":
      return { x: node.x - nodeSize.width / 2, y: node.y };
    case "Right":
      return { x: node.x + nodeSize.width / 2, y: node.y };
    case "Top":
      return { x: node.x, y: node.y - nodeSize.height / 2 };
    case "Bottom":
      return { x: node.x, y: node.y + nodeSize.height / 2 };
  }
}

// Renders one arrow connecting two flow nodes in a diagram block.
export function ArrowGenerator({
  nodes,
  connection,
  selected,
  onSelect,
}: ArrowProps) {
  const from = getPoint(nodes, connection.from);
  const to = getPoint(nodes, connection.to);
  if (!from || !to) return null;
  return (
    <>
      {/* Big invisible line for detecting when the user clicks on it */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke="black"
        strokeWidth={18}
        opacity={0.01}
        onClick={() => onSelect(connection.id)}
      />
      {/* Bigger green arrow when selected */}
      {selected && (
        <Arrow
          points={[from.x, from.y, to.x, to.y]}
          pointerLength={14}
          pointerWidth={12}
          fill="#00FF00"
          stroke="#00FF00"
          strokeWidth={6}
          listening={false}
        />
      )}
      {/* Black arrow for when not selected */}
      <Arrow
        key={connection.id}
        points={[from.x, from.y, to.x, to.y]}
        pointerLength={10}
        pointerWidth={8}
        fill="#000000"
        stroke="#000000"
        strokeWidth={3}
      />
    </>
  );
}
