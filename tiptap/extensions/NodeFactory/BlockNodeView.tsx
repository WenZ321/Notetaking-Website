import { useRef } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { BaseAttrs, CommonNodeViewProps } from "./ReactNodeViewFactory";

// Resizable block nodes carry an explicit pixel width/height
type ResizableAttrs = {
  width: number;
  height: number;
};

type BlockNodeViewProps<TAttrs extends BaseAttrs> = CommonNodeViewProps<TAttrs> & {
  resizable: boolean;
};

// Limit node resize to match the page
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Block node view: renders its preview inline, and its editor as a separate
// overlay outside the wrapper.
export function BlockNodeView<TAttrs extends BaseAttrs>({
  node,
  selected,
  extension,
  editor,
  ref,
  dataType,
  resizable,
  isEditing,
  ViewComponent,
  EditorComponent,
  deleteNode,
  updateAttributes,
  setIsEditing,
}: BlockNodeViewProps<TAttrs>) {
  const updateResizeAttributes = updateAttributes as (
    attrs: Partial<ResizableAttrs>,
  ) => void;

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  const getResizableAttrs = () => {
    return node.attrs as TAttrs & ResizableAttrs;
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

  const openEditor = () => {
    editor.commands.blur();
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
  };

  const resizableAttrs = resizable ? getResizableAttrs() : null;

  return (
    <>
      <NodeViewWrapper
        ref={ref}
        as="div"
        data-type={dataType}
        data-drag-handle=""
        draggable
        contentEditable={false}
        className={
          "tiptap-react-node-view-draggable-item" +
          (selected ? " selected" : "")
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

        <button
          className="tiptap-react-node-view-delete-button"
          contentEditable={false}
          onMouseDown={(e) => e.preventDefault()}
          onClick={deleteNode}
        >
          ×
        </button>

        <ViewComponent
          node={node}
          width={resizableAttrs?.width}
          height={resizableAttrs?.height}
          openEditor={openEditor}
        />
      </NodeViewWrapper>

      {isEditing && (
        <EditorComponent
          node={node}
          updateAttributes={updateAttributes}
          closeEditor={closeEditor}
        />
      )}
    </>
  );
}
