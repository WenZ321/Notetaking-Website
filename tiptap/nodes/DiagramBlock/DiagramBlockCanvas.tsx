import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type {
  ConnectionPoint,
  Selection,
  Viewport,
  DiagramBlockAttrs,
} from "./DiagramBlockType";
import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import { FlowNodeGenerator } from "./FlowNodeGenerator";
import { ArrowGenerator } from "./ArrowGenerator";
import { GraphPaperLayer } from "./GraphPaperLayer";

type DiagramCanvasProps = {
  mode: "preview" | "editor";
  diagramBlockInfo: DiagramBlockAttrs;
  viewport: Viewport;
  selection?: Selection;
  updateNodeText?: (id: string, text: string) => void;
  onViewportChange?: (viewport: Viewport) => void;
  onNodeDragMove?: (id: string, x: number, y: number) => void;
  onSelect?: (selection: Selection) => void;
  onAddLine?: (from: ConnectionPoint, to: ConnectionPoint) => void;
  onOpenEditor?: () => void;
};

// Konva canvas that draws a diagram block's nodes/arrows, in either preview or editor mode.
export function DiagramBlockCanvas({
  mode,
  diagramBlockInfo: { width, height, nodes, connections },
  viewport,
  selection = null,
  updateNodeText,
  onViewportChange,
  onNodeDragMove,
  onSelect,
  onAddLine,
  onOpenEditor,
}: DiagramCanvasProps) {
  const isEditor = mode === "editor";
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewportStartRef = useRef({ x: 0, y: 0 });

  // Only listens while a shape's text is being edited, so Enter isn't
  // swallowed for the rest of the page
  useEffect(() => {
    if (!isEditor || editingNodeId === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        setEditingNodeId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isEditor, editingNodeId]);

  /**
   * Scrolling in and out
   */
  const handleZoom = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      if (!isEditor) return;

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Scrolls based on cursor position
      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;

      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      onViewportChange?.({ x: newPos.x, y: newPos.y, scale: newScale });
    },
    [isEditor, viewport, onViewportChange],
  );

  /**
   * Starts the panning process when user holds down right click
   */
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isEditor) return;

      // right click
      if (e.evt.button !== 2) return;
      e.evt.preventDefault();
      isPanningRef.current = true;

      panStartRef.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
      };

      viewportStartRef.current = {
        x: viewport.x,
        y: viewport.y,
      };
    },
    [isEditor, viewport.x, viewport.y],
  );

  /**
   * Handles moving the screen when the user holds down right click and moves the cursor
   */
  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isEditor) return;
      if (!isPanningRef.current) return;

      // Right click let go outside the canvas, where its mouse up never reached us
      if (!(e.evt.buttons & 2)) {
        isPanningRef.current = false;
        return;
      }

      e.evt.preventDefault();

      const deltaX = e.evt.clientX - panStartRef.current.x;
      const deltaY = e.evt.clientY - panStartRef.current.y;

      onViewportChange?.({
        x: viewportStartRef.current.x + deltaX,
        y: viewportStartRef.current.y + deltaY,
        scale: viewport.scale,
      });
    },
    [isEditor, viewport.scale, onViewportChange],
  );

  // Stops panning when the user releases right click
  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      draggable={false}
      onContextMenu={(e) => e.evt.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={isEditor ? undefined : onOpenEditor}
      onWheel={isEditor ? handleZoom : undefined}
    >
      {/** Background graph paper layer  */}
      {isEditor && (
        <Layer listening>
          <GraphPaperLayer
            width={width}
            height={height}
            viewport={viewport}
            onClick={() => {
              onSelect?.(null);
              if (editingNodeId != null) {
                setEditingNodeId(null);
              }
            }}
          />
        </Layer>
      )}

      <Layer listening={isEditor}>
        {connections.map((c) => (
          <ArrowGenerator
            key={c.id}
            nodes={nodes}
            connection={c}
            selected={
              isEditor && selection?.type === "arrow" && selection.id === c.id
            }
            onSelect={(id) => {
              // Select and deselect when clicked
              if (!isEditor) return;
              if (selection?.type === "arrow" && selection.id === id) {
                onSelect?.(null);
              } else {
                onSelect?.({ type: "arrow", id });
              }
            }}
          />
        ))}

        {nodes.map((n) => (
          <FlowNodeGenerator
            key={n.id}
            {...n}
            isEditor={isEditor}
            isEditing={editingNodeId === n.id}
            nodeSelected={
              isEditor &&
              ((selection?.type === "node" && selection.id === n.id) ||
                (selection?.type === "connector" &&
                  selection.connectionPoint.nodeId === n.id))
            }
            connectorSelected={
              isEditor && selection?.type === "connector"
                ? selection.connectionPoint
                : null
            }
            setEditingNodeId={setEditingNodeId}
            updateNodeText={updateNodeText}
            onDragMove={(id, x, y) => {
              if (!isEditor) return;
              onNodeDragMove?.(id, x, y);
            }}
            onNodeSelect={(id) => {
              if (!isEditor) return;

              // When clicking on the currently selected node, go into edit mode
              if (selection?.type === "node" && selection.id === id) {
                setEditingNodeId(id);
                return;
              }

              setEditingNodeId(null);
              onSelect?.({
                type: "node",
                id,
              });
            }}
            onConnectorSelect={(connectionPoint) => {
              // Create a new arrow when the user selects two different connection point
              if (!isEditor) return;

              if (selection?.type === "connector") {
                if (
                  selection.connectionPoint.nodeId !== connectionPoint.nodeId
                ) {
                  onAddLine?.(selection.connectionPoint, connectionPoint);
                }
                onSelect?.(null);
                return;
              }

              onSelect?.({
                type: "connector",
                connectionPoint: connectionPoint,
              });
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
}
