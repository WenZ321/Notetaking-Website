import type { FlowNodeData, Viewport } from "./DiagramBlockType";

// Bounding box of one node, in diagram (world) coordinates
function getNodeBounds(node: FlowNodeData) {
  switch (node.shapeInfo.shape) {
    case "rectangle":
      return {
        minX: node.x - node.shapeInfo.width / 2,
        maxX: node.x + node.shapeInfo.width / 2,
        minY: node.y - node.shapeInfo.height / 2,
        maxY: node.y + node.shapeInfo.height / 2,
      };
    case "square":
      return {
        minX: node.x - node.shapeInfo.length / 2,
        maxX: node.x + node.shapeInfo.length / 2,
        minY: node.y - node.shapeInfo.length / 2,
        maxY: node.y + node.shapeInfo.length / 2,
      };
    case "ellipse":
      return {
        minX: node.x - node.shapeInfo.radiusX,
        maxX: node.x + node.shapeInfo.radiusX,
        minY: node.y - node.shapeInfo.radiusY,
        maxY: node.y + node.shapeInfo.radiusY,
      };
    case "circle":
    case "diamond":
    case "hexagon":
    case "octagon":
      return {
        minX: node.x - node.shapeInfo.radius,
        maxX: node.x + node.shapeInfo.radius,
        minY: node.y - node.shapeInfo.radius,
        maxY: node.y + node.shapeInfo.radius,
      };
  }
}

// Combined bounding box covering every node in the diagram
function getDiagramBounds(nodes: FlowNodeData[]) {
  if (nodes.length === 0) return null;

  const bounds = nodes.map(getNodeBounds);

  const minX = Math.min(...bounds.map((b) => b.minX));
  const maxX = Math.max(...bounds.map((b) => b.maxX));
  const minY = Math.min(...bounds.map((b) => b.minY));
  const maxY = Math.max(...bounds.map((b) => b.maxY));

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

// Scales and centers the diagram to fit inside width x height, with a small padding
export function getViewport(
  nodes: FlowNodeData[],
  width: number,
  height: number,
): Viewport {
  const bounds = getDiagramBounds(nodes);

  if (!bounds) {
    return { x: 0, y: 0, scale: 1 };
  }

  const padding = 5;

  const scaleX = (width - padding * 2) / bounds.width;
  const scaleY = (height - padding * 2) / bounds.height;

  const scale = Math.min(scaleX, scaleY, 1);

  return {
    x: width / 2 - bounds.centerX * scale,
    y: height / 2 - bounds.centerY * scale,
    scale,
  };
}
