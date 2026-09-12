import type { KonvaEventObject } from "konva/lib/Node";
import type {
  NodeSize,
  ConnectorSide,
  ConnectionPoint,
} from "./DiagramBlockType";
import { Circle } from "react-konva";

type Props = {
  nodeId: string;
  nodeSize: NodeSize;
  side: ConnectorSide;
  selected: boolean;
  onSelect: (connectionPoint: ConnectionPoint) => void;
};

/**
 * Calculates the (x,y) coordinate of a connector relative to its flow node
 * @param side The side of the flow node
 * @param nodeSize Length and width of the flow node
 * @returns
 */
function getConnectorCoords(side: ConnectorSide, nodeSize: NodeSize) {
  switch (side) {
    case "Left":
      return { x: -nodeSize.width / 2, y: 0 };
    case "Right":
      return { x: nodeSize.width / 2, y: 0 };
    case "Top":
      return { x: 0, y: -nodeSize.height / 2 };
    case "Bottom":
      return { x: 0, y: nodeSize.height / 2 };
  }
}

// One connector dot on the side of a flow node, used to start/end arrows.
export function FlowNodeConnector({
  nodeId,
  nodeSize,
  side,
  selected,
  onSelect,
}: Props) {
  const info = getConnectorCoords(side, nodeSize);
  return (
    <Circle
      x={info.x}
      y={info.y}
      radius={3}
      fill={selected ? "green" : "white"}
      stroke="black"
      strokeWidth={2}
      onClick={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        onSelect({ nodeId, connectorSide: side });
      }}
    />
  );
}
