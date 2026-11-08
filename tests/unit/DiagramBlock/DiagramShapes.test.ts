import type {
  FlowNodeData,
  ShapeInfo,
  ShapeType,
} from "@/tiptap/nodes/DiagramBlock/DiagramBlockType";
import { describe, expect, test } from "vitest";
import {
  getDefaultShapeInfo,
  getNodeSize,
  getOffset,
} from "@/tiptap/nodes/DiagramBlock/ShapeUtils";
import { getViewport } from "@/tiptap/nodes/DiagramBlock/ViewportGenerator";

const SHAPES: ShapeType[] = [
  "rectangle",
  "square",
  "circle",
  "ellipse",
  "diamond",
  "hexagon",
  "octagon",
];

// A diagram shape whose middle is at x, y
function makeNode(x: number, y: number, shapeInfo: ShapeInfo): FlowNodeData {
  return { id: `${x},${y}`, x, y, shapeInfo } as FlowNodeData;
}

describe("diagram shapes", () => {
  test("every new shape starts as itself with a real size", () => {
    SHAPES.forEach((shape) => {
      const info = getDefaultShapeInfo(shape);
      const { width, height } = getNodeSize(info);

      expect(info.shape).toBe(shape);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });
  });

  test("text is centered on every shape: its offset is half the shape's size", () => {
    SHAPES.forEach((shape) => {
      const info = getDefaultShapeInfo(shape);
      const { width, height } = getNodeSize(info);

      expect(getOffset(info)).toEqual({
        offsetX: width / 2,
        offsetY: height / 2,
      });
    });
  });
});

describe("getViewport", () => {
  test("an empty diagram isn't moved or scaled", () => {
    expect(getViewport([], 400, 300)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  test("a diagram smaller than the block is centered, never grown", () => {
    const square = { shape: "square", length: 40, color: "#000" } as const;
    const viewport = getViewport([makeNode(100, 100, square)], 400, 300);

    expect(viewport.scale).toBe(1);
    // the shape's middle shows in the block's middle
    expect(100 * viewport.scale + viewport.x).toBe(200);
    expect(100 * viewport.scale + viewport.y).toBe(150);
  });

  test("a diagram bigger than the block shrinks to fit inside its padding", () => {
    const wide = { shape: "rectangle", width: 1000, height: 100, color: "#000" } as const;
    const viewport = getViewport([makeNode(0, 0, wide)], 400, 300);

    // the shape's edges, drawn on the block
    const left = -500 * viewport.scale + viewport.x;
    const right = 500 * viewport.scale + viewport.x;
    expect(left).toBeCloseTo(5);
    expect(right).toBeCloseTo(395);
  });

  test("several shapes are fit together as one", () => {
    const circle = { shape: "circle", radius: 10, color: "#000" } as const;
    const viewport = getViewport(
      [makeNode(0, 0, circle), makeNode(1000, 0, circle)],
      400,
      300,
    );

    const left = -10 * viewport.scale + viewport.x;
    const right = 1010 * viewport.scale + viewport.x;
    expect(left).toBeCloseTo(5);
    expect(right).toBeCloseTo(395);
  });
});
