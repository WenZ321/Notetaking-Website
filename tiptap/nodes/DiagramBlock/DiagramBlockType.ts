// All possible konva shapes
export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "square"
  | "diamond"
  | "octagon"
  | "hexagon"
  | "cylinder";

// Information about each konva shape
export type ShapeInfo =
  | { shape: "rectangle"; width: number; height: number; color: string }
  | { shape: "circle"; radius: number; color: string }
  | { shape: "ellipse"; radiusX: number; radiusY: number; color: string }
  | { shape: "square"; length: number; color: string }
  | { shape: "diamond"; radius: number; color: string }
  | { shape: "hexagon"; radius: number; color: string }
  | { shape: "octagon"; radius: number; color: string };

// Information about a flow node
// Flow nodes are the interactable nodes where users can edit its properties
export type FlowNodeData = {
  id: string;
  x: number;
  y: number;
  shapeInfo: ShapeInfo;
  totalText: TextInfo;
};

export type NodeSize = {
  width: number;
  height: number;
};

/**
 * Connectors are so the users can connect flow nodes with arrows
 * Each flow node has 4 connectors
 */
export type ConnectorSide = "Left" | "Right" | "Top" | "Bottom";
export type ConnectionPoint = {
  nodeId: string;
  connectorSide: ConnectorSide;
};

// The connection/arrow itself
export type ConnectionData = {
  id: string;
  from: ConnectionPoint;
  to: ConnectionPoint;
};

/**
 * What the user can select when editing the diagram block
 */
export type Selection =
  | { type: "node"; id: string }
  | { type: "connector"; connectionPoint: ConnectionPoint }
  | { type: "arrow"; id: string }
  | null;

/**
 * The viewport of the diagram block
 * Editor mode: Can change the viewport by scrolling and moving the screen
 * Preview mode: Cannot change the viewport
 */
export type Viewport = {
  x: number;
  y: number;
  scale: number;
};

export type FontInfo = {
  size: number;
  family: string;
  color: string;
  bold: boolean;
  underline: boolean;
  italic: boolean;
};

export type TextInfo = {
  text: string;
} & FontInfo;

export const defaultFont: FontInfo = {
  size: 12,
  family: "Arial",
  color: "Black",
  bold: false,
  underline: false,
  italic: false,
};

// Information stored by the diagram block
export type DiagramBlockAttrs = {
  width: number;
  height: number;
  nodes: FlowNodeData[];
  connections: ConnectionData[];
  fontInfo: FontInfo;
};
