import { useState, useCallback } from "react";
import { Group } from "react-konva";
import { ShapeGenerator } from "./ShapeGenerator";
import type { KonvaEventObject } from "konva/lib/Node";
import type {
  FlowNodeData,
  ConnectionPoint,
  ConnectorSide,
} from "./DiagramBlockType";
import { FlowNodeConnector } from "./FlowNodeConnector";
import { EditableText } from "./EditableText";
import { getNodeSize } from "./ShapeUtils";

type FlowNodeProps = FlowNodeData & {
  isEditor: boolean;
  isEditing: boolean;
  nodeSelected: boolean;
  connectorSelected: ConnectionPoint | null;
  setEditingNodeId?: (editingNodeId: string) => void;
  updateNodeText?: (id: string, text: string) => void;
  onNodeSelect?: (id: string) => void;
  onConnectorSelect?: (point: ConnectionPoint) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  openNodeEditor?: () => void;
};

/**
 * Checks if the connection point on the side of nodeId is selected
 * @param selectedConnectionPoint The currently selected connection point if any
 * @param nodeId The node id of this flow node
 * @param side The side of this flow node
 * @returns Whether a connection point is selected
 */
function isSelected(
  selectedConnectionPoint: ConnectionPoint | null,
  nodeId: string,
  side: ConnectorSide,
): boolean {
  if (selectedConnectionPoint === null) return false;

  return (
    selectedConnectionPoint.nodeId === nodeId &&
    selectedConnectionPoint.connectorSide === side
  );
}

// TODO: Make flow nodes resizeable!!
export function FlowNodeGenerator({
  id,
  totalText,
  x,
  y,
  shapeInfo,
  isEditor,
  isEditing,
  nodeSelected,
  connectorSelected,
  setEditingNodeId,
  updateNodeText,
  onNodeSelect,
  onConnectorSelect,
  onDragMove,
}: FlowNodeProps) {
  const nodeSize = getNodeSize(shapeInfo);
  const sides: ConnectorSide[] = ["Left", "Right", "Top", "Bottom"];
  const [isHovering, setHovering] = useState<boolean>(false);

  const handleHovering = useCallback(() => {
    setHovering(true);
  }, []);

  const handleUnhovering = useCallback(() => {
    setHovering(false);
  }, []);

  return (
    <Group
      x={x}
      y={y}
      draggable={isEditor}
      onDragMove={(e: KonvaEventObject<DragEvent>) => {
        onDragMove?.(id, e.target.x(), e.target.y());
      }}
      onClick={() => {
        onNodeSelect?.(id);
      }}
      onDblClick={() => setEditingNodeId?.(id)}
      onMouseEnter={handleHovering}
      onMouseLeave={handleUnhovering}
    >
      <>
        {/** The konva shape representing the node */}
        <ShapeGenerator
          shapeInfo={shapeInfo}
          selected={nodeSelected || isEditing}
        />
        {/** Editable text on the node */}
        <EditableText
          isEditing={isEditing}
          nodeSize={nodeSize}
          shapeInfo={shapeInfo}
          textInfo={totalText}
          updateText={(text: string) => {
            updateNodeText?.(id, text);
          }}
        />

        {isEditor && (isHovering || nodeSelected || isEditing) && (
          <>
            {sides.map((side) => (
              <FlowNodeConnector
                key={side}
                nodeId={id}
                nodeSize={nodeSize}
                side={side}
                selected={isSelected(connectorSelected, id, side)}
                onSelect={(connectionPoint) =>
                  onConnectorSelect?.(connectionPoint)
                }
              />
            ))}
          </>
        )}
      </>
    </Group>
  );
}
