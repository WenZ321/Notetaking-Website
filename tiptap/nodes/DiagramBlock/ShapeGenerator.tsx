import type { ShapeInfo } from "./DiagramBlockType";
import { Rect, Circle, Ellipse, RegularPolygon } from "react-konva";

type ShapeGeneratorProps = {
  shapeInfo: ShapeInfo;
  selected: boolean;
};

/**
 * Returns a react-konva shape based on shapeInfo
 */
export function ShapeGenerator({
  shapeInfo,
  selected,
}: ShapeGeneratorProps) {
  const stroke = selected ? "#000" : undefined;
  const strokeWidth = selected ? 3 : 0;

  switch (shapeInfo.shape) {
    case "rectangle":
      return (
        <Rect
          width={shapeInfo.width}
          height={shapeInfo.height}
          fill={shapeInfo.color}
          cornerRadius={8}
          offsetX={shapeInfo.width / 2}
          offsetY={shapeInfo.height / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "circle":
      return (
        <Circle
          radius={shapeInfo.radius}
          fill={shapeInfo.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "ellipse":
      return (
        <Ellipse
          radiusX={shapeInfo.radiusX}
          radiusY={shapeInfo.radiusY}
          fill={shapeInfo.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "square":
      return (
        <Rect
          width={shapeInfo.length}
          height={shapeInfo.length}
          fill={shapeInfo.color}
          cornerRadius={8}
          offsetX={shapeInfo.length / 2}
          offsetY={shapeInfo.length / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "diamond":
      return (
        <RegularPolygon
          sides={4}
          radius={shapeInfo.radius}
          fill={shapeInfo.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "hexagon":
      return (
        <RegularPolygon
          sides={6}
          radius={shapeInfo.radius}
          fill={shapeInfo.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "octagon":
      return (
        <RegularPolygon
          sides={8}
          radius={shapeInfo.radius}
          fill={shapeInfo.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
  }
}
