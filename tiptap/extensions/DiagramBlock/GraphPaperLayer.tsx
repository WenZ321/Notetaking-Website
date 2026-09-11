import { Line, Rect } from "react-konva";
import type { Viewport } from "./DiagramBlockType";

type GraphPaperProps = {
  width: number;
  height: number;
  viewport: Viewport;
  gridSize?: number;
  onClick: () => void;
};

export function GraphPaperLayer({
  width,
  height,
  viewport,
  gridSize = 25,
  onClick,
}: GraphPaperProps) {
  const lines = [];
  const scale = viewport.scale;

  const worldLeft = -viewport.x / scale;
  const worldTop = -viewport.y / scale;
  const worldRight = worldLeft + width / scale;
  const worldBottom = worldTop + height / scale;

  const startX = Math.floor(worldLeft / gridSize) * gridSize;
  const endX = Math.ceil(worldRight / gridSize) * gridSize;

  const startY = Math.floor(worldTop / gridSize) * gridSize;
  const endY = Math.ceil(worldBottom / gridSize) * gridSize;

  let index = 0;

  for (let x = startX; x <= endX; x += gridSize) {
    lines.push(
      <Line
        key={`v-${index++}`}
        points={[x, worldTop, x, worldBottom]}
        stroke="#e5e7eb"
        strokeWidth={1 / scale}
        listening={false}
      />,
    );
  }

  for (let y = startY; y <= endY; y += gridSize) {
    lines.push(
      <Line
        key={`h-${index++}`}
        points={[worldLeft, y, worldRight, y]}
        stroke="#e5e7eb"
        strokeWidth={1 / scale}
        listening={false}
      />,
    );
  }

  return (
    <>
      <Rect
        x={worldLeft}
        y={worldTop}
        width={worldRight - worldLeft}
        height={worldBottom - worldTop}
        fill="white"
        opacity={0.001}
        onClick={onClick}
      />
      {lines}
    </>
  );
}
