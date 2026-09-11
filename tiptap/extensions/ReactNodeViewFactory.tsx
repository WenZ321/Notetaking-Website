import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import { useRef, useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import "./ReactNodeViewFactory.css";

// Default attributes of all custom react extensions will have this structure
type BaseAttrs = Record<string, unknown>;

/**
 * Depending on whether the extension is inline or a block, it will be resizeable by the user
 */
type ResizableAttrs = {
  width: number;
  height: number;
};

type TypedNode<TAttrs extends BaseAttrs> = ReactNodeViewProps["node"] & {
  attrs: TAttrs;
};

// Preview component of the node
export type PreviewComponentProps<TAttrs extends BaseAttrs> = {
  width?: number;
  height?: number;
  node: TypedNode<TAttrs>;
  openEditor: () => void;
};

// Editor component of the node
export type EditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
  closeEditor: () => void;
};

type CreateReactNodeViewOptions<TAttrs extends BaseAttrs> = {
  dataType: string;
  ViewComponent: ComponentType<PreviewComponentProps<TAttrs>>;
  EditorComponent: ComponentType<EditorComponentProps<TAttrs>>;
  resizable: boolean;
  wrapperTag: "div" | "span";
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function CreateReactNodeView<TAttrs extends BaseAttrs>({
  dataType,
  ViewComponent,
  EditorComponent,
  resizable = true,
  wrapperTag = "div",
}: CreateReactNodeViewOptions<TAttrs>): ComponentType<ReactNodeViewProps> {
  return function ReactNodeView(props: ReactNodeViewProps) {
    const { node, selected, deleteNode, updateAttributes, extension, editor } =
      props;

    const typedNode = node as TypedNode<TAttrs>;

    const typedUpdateAttributes = updateAttributes as (
      attrs: Partial<TAttrs>,
    ) => void;

    const updateResizeAttributes = updateAttributes as (
      attrs: Partial<ResizableAttrs>,
    ) => void;

    const [isEditing, setIsEditing] = useState(false);

    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startWidthRef = useRef(0);
    const startHeightRef = useRef(0);

    const getResizableAttrs = () => {
      return typedNode.attrs as TAttrs & ResizableAttrs;
    };

    // Handles resizing of the node
    const startResize = (
      e: React.MouseEvent<HTMLDivElement>,
      direction: "bottom" | "right",
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (!resizable) return;

      const attrs = getResizableAttrs();

      const MIN_WIDTH = 150;
      const MIN_HEIGHT = 100;
      const MAX_WIDTH = (extension.options.maxWidth as number) ?? 1000;
      const MAX_HEIGHT = (extension.options.maxHeight as number) ?? 1000;

      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startWidthRef.current = attrs.width;
      startHeightRef.current = attrs.height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const deltaY = moveEvent.clientY - startYRef.current;

        if (direction === "bottom") {
          updateResizeAttributes({
            height: clamp(
              startHeightRef.current + deltaY,
              MIN_HEIGHT,
              MAX_HEIGHT,
            ),
          });
        }

        if (direction === "right") {
          updateResizeAttributes({
            width: clamp(startWidthRef.current + deltaX, MIN_WIDTH, MAX_WIDTH),
          });
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    useEffect(() => {
      editor.setEditable(!isEditing);

      return () => {
        editor.setEditable(true);
      };
    }, [editor, isEditing]);

    const handleOpenEditor = () => {
      editor.commands.blur();
      setIsEditing(true);
    };

    const resizableAttrs = resizable ? getResizableAttrs() : null;

    return (
      <>
        <NodeViewWrapper
          as={wrapperTag}
          data-type={dataType}
          data-drag-handle=""
          draggable={true}
          contentEditable={false}
          className={
            selected
              ? "tiptap-react-node-view-draggable-item selected"
              : "tiptap-react-node-view-draggable-item"
          }
        >
          {resizable && (
            <>
              <div
                className="tiptap-react-node-view-resize-handle resize-handle-bottom"
                contentEditable={false}
                onMouseDown={(e) => startResize(e, "bottom")}
              />

              <div
                className="tiptap-react-node-view-resize-handle resize-handle-right"
                contentEditable={false}
                onMouseDown={(e) => startResize(e, "right")}
              />
            </>
          )}

          {wrapperTag === "div" && (
            <button
              className="tiptap-react-node-view-delete-button"
              contentEditable={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteNode}
            >
              ×
            </button>
          )}

          <ViewComponent
            node={typedNode}
            width={resizableAttrs?.width}
            height={resizableAttrs?.height}
            openEditor={handleOpenEditor}
          />
        </NodeViewWrapper>

        {isEditing && (
          <EditorComponent
            node={typedNode}
            updateAttributes={typedUpdateAttributes}
            closeEditor={() => setIsEditing(false)}
          />
        )}
      </>
    );
  };
}
