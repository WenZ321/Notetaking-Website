import type {
  FlowNodeData,
  ShapeType,
  ConnectionPoint,
  ConnectionData,
  Selection,
  Viewport,
  FontInfo,
  TextInfo,
  DiagramBlockAttrs,
} from "./DiagramBlockType";
import type { EditorComponentProps } from "../ReactNodeViewFactory";
import { defaultFont } from "./DiagramBlockType";
import { useState, useCallback, useEffect } from "react";
import { DiagramBlockTextFormattingToolbar } from "./DiagramBlockTextFormattingToolbar";
import { DiagramShapePalette } from "./DiagramShapePalette";
import { DiagramBlockCanvas } from "./DiagramBlockCanvas";
import { getDefaultShapeInfo } from "./ShapeUtils";
import { getViewport } from "./ViewportGenerator";
import { TiptapNodeEditor } from "../TiptapNodeView/TiptapNodeEditor";
import "./DiagramBlockEditor.css";

// Full-screen editor overlay for adding/editing a diagram block's nodes and arrows.
export function DiagramBlockEditor({
  node, // This represents the diagram block "node"
  updateAttributes, // Updates the attributes of node above
  closeEditor,
}: EditorComponentProps<DiagramBlockAttrs>) {
  const width = 1000;
  const height = 1000;
  const [nodes, setNodes] = useState<FlowNodeData[]>(node.attrs.nodes);
  const [connections, setConnections] = useState<ConnectionData[]>(
    node.attrs.connections,
  );
  const [selection, setSelection] = useState<Selection>(null);
  const viewport = getViewport(nodes, width, height);
  const [currViewport, setViewport] = useState<Viewport>(viewport);
  const [currFontInfo, setFontInfo] = useState<FontInfo>(node.attrs.fontInfo);

  // When the user drags a flow node
  const handleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    },
    [setNodes],
  );

  const updateNodeText = useCallback(
    (id: string, text: string) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== id) return node;

          return {
            ...node,
            totalText: {
              ...node.totalText,
              text: text,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  // Adding new flow nodes to the diagram block
  const addNode = useCallback(
    (shape: ShapeType) => {
      const shapeInfo = getDefaultShapeInfo(shape);
      const newNode: FlowNodeData = {
        id: crypto.randomUUID(),
        x: Math.random() * 200,
        y: Math.random() * 200,
        shapeInfo: shapeInfo,
        totalText: {
          text: shape,
          ...defaultFont,
        } as TextInfo,
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [setNodes],
  );

  // Adding new arrows
  const addLine = useCallback(
    (from: ConnectionPoint, to: ConnectionPoint) => {
      const newLine: ConnectionData = {
        id: crypto.randomUUID(),
        from,
        to,
      };

      setConnections((prev) => [...prev, newLine]);
    },
    [setConnections],
  );

  const handleFontChange = useCallback(
    (fontInfo: FontInfo) => {
      if (selection?.type !== "node") {
        setFontInfo(fontInfo);
      } else {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === selection.id
              ? {
                  ...node,
                  totalText: {
                    ...node.totalText,
                    ...fontInfo,
                  },
                }
              : node,
          ),
        );
      }
    },
    [selection],
  );

  // Saving added nodes and arrows
  const handleSave = useCallback(() => {
    updateAttributes({
      nodes,
      connections,
      fontInfo: currFontInfo,
    });

    closeEditor();
  }, [nodes, connections, currFontInfo, updateAttributes, closeEditor]);

  // When the user presses delete/escape when selecting something
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault(); // Stops the default browser/tiptap default behavior when pressing this key
        e.stopPropagation(); // Stops other event listeners from being notified about this key press

        if (!selection) return;

        if (selection.type === "node") {
          setNodes((prev) => prev.filter((n) => n.id !== selection.id));

          setConnections((prev) =>
            prev.filter(
              (c) =>
                c.from.nodeId !== selection.id && c.to.nodeId !== selection.id,
            ),
          );
        }

        if (selection.type === "arrow") {
          setConnections((prev) => prev.filter((c) => c.id !== selection.id));
        }

        setSelection(null);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();

        setSelection(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [selection]);

  return (
    <TiptapNodeEditor
      closeEditor={handleSave}
      backgroundClassName="diagram-block-editor-background"
    >
      <DiagramBlockTextFormattingToolbar
        onFontChange={handleFontChange}
        currFontInfo={
          selection?.type === "node"
            ? (() => {
                const textInfo = nodes.find(
                  (n) => n.id === selection.id,
                )?.totalText;
                if (!textInfo) return currFontInfo;

                const { text, ...fontInfo } = textInfo;
                return fontInfo;
              })()
            : currFontInfo
        }
      />

      <div className="diagram-block-editor-workspace">
        <main className="diagram-block-editor-canvas">
          <DiagramBlockCanvas
            mode={"editor"}
            diagramBlockInfo={{
              width,
              height,
              nodes,
              connections,
              fontInfo: currFontInfo,
            }}
            viewport={currViewport}
            selection={selection}
            updateNodeText={updateNodeText}
            onViewportChange={setViewport}
            onNodeDragMove={handleDragMove}
            onSelect={setSelection}
            onAddLine={addLine}
          />
        </main>

        <aside className="diagram-block-editor-shape-palette-sidebar">
          <DiagramShapePalette addNode={addNode} />
        </aside>
      </div>
    </TiptapNodeEditor>
  );
}
