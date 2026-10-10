import { useContext, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { NotebookTemplateContext } from "@/components/NotebookTemplates/NotebookTemplateContext";
import { getPaperSnapLength } from "@/components/NotebookTemplates/notebookTemplates";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { MIN_BLOCK_WIDTH } from "./snapBlockSizeToPaper";
import { findLeftColumn } from "./findLeftColumn";
import type { BaseAttrs, CommonNodeViewProps } from "./ReactNodeViewFactory";
import type { MaxBlockSize } from "./ReactNodeFactory";

// Transaction meta sent when a block resize starts and ends, so other
// extensions can wait for the final size instead of reacting to every step
export const BLOCK_RESIZE_META = "blockResize";

export type BlockResizeMeta = "start" | "end";

// Resizable block nodes carry an explicit pixel width/height
type ResizableAttrs = {
  width: number;
  height: number;
};

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
  const snapLength = getPaperSnapLength(useContext(NotebookTemplateContext));
  const updateResizeAttributes = updateAttributes as (
    attrs: Partial<ResizableAttrs>,
  ) => void;

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  // Smallest width the preview's content allows, reported by the preview itself
  const [contentMinWidth, setContentMinWidth] = useState(0);

  // Shortest height the preview's content allows, reported by the preview
  // itself. Blocks that don't report keep the usual limit
  const [contentMinHeight, setContentMinHeight] = useState(100);

  // Keeps the outline on while dragging, even if the handle slides out from under the cursor
  const [isResizing, setIsResizing] = useState(false);

  const getResizableAttrs = () => {
    return node.attrs as TAttrs & ResizableAttrs;
  };

  // Sends an empty change labeled "start" or "end" to the editor. The
  // WrappedBlock plugin reads the label to wait until the resize is done
  const announceResize = (phase: BlockResizeMeta) => {
    editor.view.dispatch(editor.state.tr.setMeta(BLOCK_RESIZE_META, phase));
  };

  // Handles resizing of the node
  const startResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: "bottom" | "right" | "left",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const blockPos = getPos();
    if (!resizable || blockPos === undefined) return;

    const attrs = getResizableAttrs();

    const MIN_WIDTH = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    const maxSize = extension.options.maxSize as MaxBlockSize;
    const MAX_WIDTH = maxSize.maxWidth;
    const MAX_HEIGHT = maxSize.maxHeight;
    const MIN_HEIGHT = Math.min(contentMinHeight, MAX_HEIGHT);

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startWidthRef.current = attrs.width;
    startHeightRef.current = attrs.height;

    // Text on the left with a saved width trades space with the block. Text
    // without one just fills what's left, and with no text the block can
    // only shrink, keeping to the left edge
    const leftColumn = findLeftColumn(editor.state, blockPos);
    const hasLeftText = leftColumn?.node.attrs.columnType === "text";
    const leftTextWidth: number | null = hasLeftText
      ? leftColumn!.node.attrs.width
      : null;
    const MAX_LEFT_WIDTH = !hasLeftText
      ? attrs.width
      : Math.min(MAX_WIDTH, attrs.width + (leftTextWidth ?? Infinity));

    // With saved left text, the block can only grow into the right text, so
    // the left text, block and right text always add up to the row
    const MAX_RIGHT_WIDTH =
      leftTextWidth === null
        ? MAX_WIDTH
        : Math.min(MAX_WIDTH, NOTEBOOK_PAGE_WIDTH - leftTextWidth);

    setIsResizing(true);
    announceResize("start");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;

      // Stays within the limits, and on graph paper moves a square at a time
      if (direction === "bottom") {
        updateResizeAttributes({
          height: snapLength(startHeightRef.current + deltaY, {
            min: MIN_HEIGHT,
            max: MAX_HEIGHT,
          }),
        });
      }

      if (direction === "right") {
        updateResizeAttributes({
          width: snapLength(startWidthRef.current + deltaX, {
            min: MIN_WIDTH,
            max: MAX_RIGHT_WIDTH,
          }),
        });
      }

      if (direction === "left") {
        const width = snapLength(startWidthRef.current - deltaX, {
          min: MIN_WIDTH,
          max: MAX_LEFT_WIDTH,
        });

        if (leftTextWidth === null) {
          updateResizeAttributes({ width });
          return;
        }

        // The left text takes what the block gives up, so the block's right
        // edge stays put
        editor.view.dispatch(
          editor.state.tr
            .setNodeAttribute(blockPos, "width", width)
            .setNodeAttribute(
              leftColumn!.pos,
              "width",
              leftTextWidth + startWidthRef.current - width,
            ),
        );
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      announceResize("end");
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
          (selected ? " selected" : "") +
          (isResizing ? " resizing" : "")
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
