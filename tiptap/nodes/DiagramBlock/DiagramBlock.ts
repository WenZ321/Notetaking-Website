import type { DiagramBlockAttrs } from "./DiagramBlockType";
import { defaultFont } from "./DiagramBlockType";
import { DiagramBlockView } from "./DiagramBlockView";
import { CreateReactNodeExtension } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";

// Starting content for a brand-new diagram block
const defaultDiagramAttrs = {
  width: 400,
  height: 250,
  nodes: [
    {
      id: "1",
      x: 150,
      y: 150,
      shapeInfo: {
        shape: "rectangle",
        width: 120,
        height: 50,
        color: "#2196F3",
      },
      totalText: {
        text: "boom",
        size: 12,
        family: "Roboto",
        color: "Black",
        bold: false,
        underline: false,
        italic: true,
      },
    },
    {
      id: "2",
      x: 350,
      y: 150,
      shapeInfo: { shape: "circle", radius: 40, color: "#2196F3" },
      totalText: {
        text: "herro",
        size: 12,
        family: "Arial",
        color: "Purple",
        bold: true,
        underline: false,
        italic: false,
      },
    },
  ],
  connections: [
    {
      id: "conn1",
      from: { nodeId: "1", connectorSide: "Right" },
      to: { nodeId: "2", connectorSide: "Left" },
    },
  ],
  fontInfo: defaultFont,
} satisfies DiagramBlockAttrs;

/**
 * Creates the custom react node extension for the diagram block
 */
export const DiagramBlock = CreateReactNodeExtension({
  name: "DiagramBlock",
  dataType: "diagram-block",
  defaultAttrs: defaultDiagramAttrs,
  component: DiagramBlockView,
  group: "block",
  maxSize: {
    maxWidth: NOTEBOOK_PAGE_WIDTH,
    maxHeight: 600,
  },
  draggable: true,
  toolbarFields: [],
});
