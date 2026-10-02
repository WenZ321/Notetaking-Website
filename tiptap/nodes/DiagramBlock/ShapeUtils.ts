import type { ShapeType, ShapeInfo, NodeSize } from "./DiagramBlockType";

// Pure helpers for computing a flow node shape's default info, text offset, and pixel size.
// Starting size/color for a newly added shape
export function getDefaultShapeInfo(shape: ShapeType): ShapeInfo {
  switch (shape) {
    case "rectangle":
      return {
        shape,
        width: 120,
        height: 50,
        color: "#2196F3",
      };

    case "square":
      return {
        shape,
        length: 80,
        color: "#2196F3",
      };

    case "circle":
      return {
        shape,
        radius: 40,
        color: "#2196F3",
      };

    case "ellipse":
      return {
        shape,
        radiusX: 70,
        radiusY: 35,
        color: "#2196F3",
      };

    case "diamond":
      return {
        shape,
        radius: 50,
        color: "#2196F3",
      };

    case "hexagon":
      return {
        shape,
        radius: 50,
        color: "#2196F3",
      };

    case "octagon":
      return {
        shape,
        radius: 50,
        color: "#2196F3",
      };
    case "cylinder":
      return {
        shape: "rectangle",
        width: 120,
        height: 50,
        color: "#2196F3",
      };
  }
}

// Distance from a shape's center to its edge, used to center text on it
export function getOffset(shapeInfo: ShapeInfo) {
  switch (shapeInfo.shape) {
    case "rectangle":
      return {
        offsetX: shapeInfo.width / 2,
        offsetY: shapeInfo.height / 2,
      };

    case "square":
      return {
        offsetX: shapeInfo.length / 2,
        offsetY: shapeInfo.length / 2,
      };

    case "ellipse":
      return {
        offsetX: shapeInfo.radiusX,
        offsetY: shapeInfo.radiusY,
      };
    case "circle":
    case "diamond":
    case "hexagon":
    case "octagon":
      return {
        offsetX: shapeInfo.radius,
        offsetY: shapeInfo.radius,
      };
  }
}

/**
 * Gets the size of a flow node
 * @param shapeInfo The shape info of a konva shape
 * @returns The width and height of the shape
 */
export function getNodeSize(shapeInfo: ShapeInfo): NodeSize {
  switch (shapeInfo.shape) {
    case "rectangle":
      return {
        width: shapeInfo.width,
        height: shapeInfo.height,
      };

    case "square":
      return {
        width: shapeInfo.length,
        height: shapeInfo.length,
      };

    case "circle":
      return {
        width: shapeInfo.radius * 2,
        height: shapeInfo.radius * 2,
      };

    case "ellipse":
      return {
        width: shapeInfo.radiusX * 2,
        height: shapeInfo.radiusY * 2,
      };

    case "diamond":
    case "hexagon":
    case "octagon":
      return {
        width: shapeInfo.radius * 2,
        height: shapeInfo.radius * 2,
      };
  }
}
