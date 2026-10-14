import { NodeViewWrapper } from "@tiptap/react";
import type { BaseAttrs, CommonNodeViewProps } from "./ReactNodeViewFactory";
import type { MaxBlockSize } from "./ReactNodeFactory";
import type { ResizableAttrs } from "./NodeResizeLogic/useBlockResize";
import { useBlockResize } from "./NodeResizeLogic/useBlockResize";

type BlockNodeViewProps<TAttrs extends BaseAttrs> =
  CommonNodeViewProps<TAttrs> & {
    resizable: boolean;
  };

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
  getPos,
  deleteNode,
  updateAttributes,
  setIsEditing,
}: BlockNodeViewProps<TAttrs>) {
  const {
    isResizing,
    resizeMargin,
    contentMinWidth,
    contentMinHeight,
    startResize,
    setContentMinWidth,
    setContentMinHeight,
  } = useBlockResize({
    node,
    editor,
    maxSize: extension.options.maxSize as MaxBlockSize,
    getPos,
    updateAttributes: updateAttributes as (
      attrs: Partial<ResizableAttrs>,
    ) => void,
  });

  const openEditor = () => {
    editor.commands.blur();
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
  };

  const resizableAttrs = resizable
    ? (node.attrs as TAttrs & ResizableAttrs)
    : null;

  return (
    <>
      <NodeViewWrapper
        ref={ref}
        as="div"
        data-type={dataType}
        // the smallest size the content allows, read when the block is dragged
        data-content-min-width={contentMinWidth}
        data-content-min-height={contentMinHeight}
        data-drag-handle=""
        draggable
        contentEditable={false}
        className={
          "tiptap-react-node-view-draggable-item" +
          (selected ? " selected" : "") +
          (isResizing ? " resizing" : "") +
          (resizeMargin ? ` resize-margin-${resizeMargin.side}` : "")
        }
        style={
          resizeMargin
            ? ({
                "--resize-margin": `${resizeMargin.size}px`,
              } as React.CSSProperties)
            : undefined
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
              className="tiptap-react-node-view-resize-handle resize-handle-left"
              contentEditable={false}
              onMouseDown={(e) => startResize(e, "left")}
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
          reportMinWidth={setContentMinWidth}
          reportMinHeight={setContentMinHeight}
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
