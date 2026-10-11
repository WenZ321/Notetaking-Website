import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MaxBlockSize } from "../ReactNodeFactory";
import { useContext, useState } from "react";
import { NotebookTemplateContext } from "@/components/NotebookTemplates/NotebookTemplateContext";
import { getPaperSnapLength } from "@/components/NotebookTemplates/notebookTemplates";
import { MIN_BLOCK_WIDTH } from "@/components/NotebookTemplates/PaperLogic/snapBlockSizeToPaper";
import { getBlockRow } from "./getBlockRow";
import { RESIZE_BUFFER, getSideResizeLimits } from "./sideResizeLimits";
import { fillGapWithText } from "./fillGapWithText";
import { getTextRemovalPreview, removePushedText } from "./removePushedText";
import { setTextRemovalPreview } from "@/tiptap/extensions/ResizePreview/resizePreviewPlugin";

// Transaction meta sent when a block resize starts and ends, so other
// extensions can wait for the final size instead of reacting to every step
export const BLOCK_RESIZE_META = "blockResize";

export type BlockResizeMeta = "start" | "end";

// Resizable block nodes carry an explicit pixel width/height
export type ResizableAttrs = {
  width: number;
  height: number;
};

type ResizeDirection = "bottom" | "right" | "left";

type UseBlockResizeOptions = {
  node: ProseMirrorNode;
  editor: Editor;
  maxSize: MaxBlockSize;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Partial<ResizableAttrs>) => void;
};

// Resizes a block with its bottom, left and right handles, keeping it on
// the paper and keeping the edge that isn't dragged where it is
export function useBlockResize({
  node,
  editor,
  maxSize,
  getPos,
  updateAttributes,
}: UseBlockResizeOptions) {
  const snapLength = getPaperSnapLength(useContext(NotebookTemplateContext));

  // Smallest width the preview's content allows, reported by the preview itself
  const [contentMinWidth, setContentMinWidth] = useState(0);

  // Shortest height the preview's content allows, reported by the preview
  // itself. Blocks that don't report keep the usual limit
  const [contentMinHeight, setContentMinHeight] = useState(100);

  // Keeps the outline on while dragging, even if the handle slides out from under the cursor
  const [isResizing, setIsResizing] = useState(false);

  // Extra space on one side of the block while resizing. A gap opened on a
  // side with no text is positive, and the block laid over text it will
  // remove is negative
  const [resizeMargin, setResizeMargin] = useState<{
    side: "left" | "right";
    size: number;
  } | null>(null);

  // Sends an empty change labeled "start" or "end" to the editor. The
  // WrappedBlock plugin reads the label to wait until the resize is done
  const announceResize = (phase: BlockResizeMeta) => {
    editor.view.dispatch(editor.state.tr.setMeta(BLOCK_RESIZE_META, phase));
  };

  // Starts a resize from one of the handles and follows the mouse until
  // it's let go
  const startResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: ResizeDirection,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const blockPos = getPos();
    if (blockPos === undefined) return;

    const attrs = node.attrs as ResizableAttrs;

    const MIN_WIDTH = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    const MAX_WIDTH = maxSize.maxWidth;
    const MAX_HEIGHT = maxSize.maxHeight;
    const MIN_HEIGHT = Math.min(contentMinHeight, MAX_HEIGHT);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = attrs.width;
    const startHeight = attrs.height;

    // Side handles keep the block's other edge where it is
    const row = getBlockRow(editor.state, blockPos);
    const sideLimits =
      direction === "bottom"
        ? null
        : getSideResizeLimits(direction, row, attrs.width, {
            min: MIN_WIDTH,
            max: MAX_WIDTH,
          });

    // The empty gap shrinking leaves on a side that has no text
    let gap = 0;

    // Whether letting go now removes the text the block is pushing into, and
    // the width the block grows to when it does
    let removesText = false;
    const pushedText = sideLimits?.pushedText;
    const widthAfterRemoval = pushedText
      ? Math.min(MAX_WIDTH, startWidth + pushedText.width)
      : startWidth;

    // The last size sent, so moves that snap to the same size send nothing
    let lastWidth = startWidth;
    let lastHeight = startHeight;

    setIsResizing(true);
    announceResize("start");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Stays within the limits, and on graph paper moves a square at a time
      if (direction === "bottom") {
        const height = snapLength(startHeight + deltaY, {
          min: MIN_HEIGHT,
          max: MAX_HEIGHT,
        });
        if (height === lastHeight) return;

        lastHeight = height;
        updateAttributes({ height });
        return;
      }

      if (!sideLimits) return;

      // moving right grows the block from the right handle but shrinks it from the left one
      const growth = direction === "right" ? deltaX : -deltaX;
      const wantedWidth = startWidth + growth;

      // The block stops when the text it pushes is at its smallest, and
      // dragging on past the buffer removes that text on release
      const { removeTextAt } = sideLimits;
      const wasRemovingText = removesText;
      removesText = removeTextAt !== null && wantedWidth >= removeTextAt;

      // A gap only opens once the drag passes the buffer
      const isWithinGapBuffer =
        sideLimits.opensGap && startWidth - wantedWidth < RESIZE_BUFFER;
      const width = isWithinGapBuffer
        ? startWidth
        : snapLength(wantedWidth, sideLimits);

      // Past the buffer the block shows its final width, laid over the text
      // it will remove, so the row keeps its layout until letting go
      const shownWidth = removesText ? widthAfterRemoval : width;
      if (shownWidth === lastWidth && removesText === wasRemovingText) return;
      lastWidth = shownWidth;

      if (removesText !== wasRemovingText && row) {
        setTextRemovalPreview(
          editor.view,
          removesText ? getTextRemovalPreview(row, direction) : null,
        );
      }

      if (sideLimits.opensGap) {
        gap = startWidth - width;
        setResizeMargin(gap > 0 ? { side: direction, size: gap } : null);
      } else {
        setResizeMargin(
          removesText ? { side: direction, size: width - shownWidth } : null,
        );
      }

      // The text before takes what the block gives up, so the block's right
      // edge stays put
      const textBefore = row?.textBefore;
      if (direction === "left" && textBefore) {
        editor.view.dispatch(
          editor.state.tr
            .setNodeAttribute(blockPos, "width", shownWidth)
            .setNodeAttribute(
              textBefore.pos,
              "width",
              textBefore.width + startWidth - width,
            ),
        );
        return;
      }

      updateAttributes({ width: shownWidth });
    };

    const handleMouseUp = () => {
      if (row && direction !== "bottom") {
        if (removesText) setTextRemovalPreview(editor.view, null);
        if (gap > 0) fillGapWithText(editor, row, direction, gap);

        // the block grows into the removed text's space
        if (removesText) {
          removePushedText(editor, row, direction, blockPos, widthAfterRemoval);
        }
      }

      setResizeMargin(null);
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      announceResize("end");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return {
    isResizing,
    resizeMargin,
    startResize,
    setContentMinWidth,
    setContentMinHeight,
  };
}
