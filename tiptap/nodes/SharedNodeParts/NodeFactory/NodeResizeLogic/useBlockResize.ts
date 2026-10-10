import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MaxBlockSize } from "../ReactNodeFactory";
import { useContext, useRef, useState } from "react";
import { NotebookTemplateContext } from "@/components/NotebookTemplates/NotebookTemplateContext";
import { getPaperSnapLength } from "@/components/NotebookTemplates/notebookTemplates";
import { MIN_BLOCK_WIDTH } from "@/components/NotebookTemplates/PaperLogic/snapBlockSizeToPaper";
import { getBlockRow } from "./getBlockRow";
import { getSideResizeLimits } from "./sideResizeLimits";
import { fillGapWithText } from "./fillGapWithText";

// Transaction meta sent when a block resize starts and ends, so other
// extensions can wait for the final size instead of reacting to every step
export const BLOCK_RESIZE_META = "blockResize";

export type BlockResizeMeta = "start" | "end";

// Resizable block nodes carry an explicit pixel width/height
export type ResizableAttrs = {
  width: number;
  height: number;
};

export type ResizeDirection = "bottom" | "right" | "left";

type UseBlockResizeOptions = {
  node: ProseMirrorNode;
  editor: Editor;
  maxSize: MaxBlockSize;
  resizable: boolean;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Partial<ResizableAttrs>) => void;
};

// Resizes a block with its bottom, left and right handles, keeping it on
// the paper and keeping the edge that isn't dragged where it is
export function useBlockResize({
  node,
  editor,
  maxSize,
  resizable,
  getPos,
  updateAttributes,
}: UseBlockResizeOptions) {
  const snapLength = getPaperSnapLength(useContext(NotebookTemplateContext));

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

  // An empty gap beside the block while it shrinks from a side with no
  // text. It becomes a text column once the resize ends
  const [resizeGap, setResizeGap] = useState<{
    side: "left" | "right";
    size: number;
  } | null>(null);

  // Sends an empty change labeled "start" or "end" to the editor. The
  // WrappedBlock plugin reads the label to wait until the resize is done
  const announceResize = (phase: BlockResizeMeta) => {
    editor.view.dispatch(editor.state.tr.setMeta(BLOCK_RESIZE_META, phase));
  };

  // Handles resizing of the node
  const startResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: ResizeDirection,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const blockPos = getPos();
    if (!resizable || blockPos === undefined) return;

    const attrs = node.attrs as ResizableAttrs;

    const MIN_WIDTH = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    const MAX_WIDTH = maxSize.maxWidth;
    const MAX_HEIGHT = maxSize.maxHeight;
    const MIN_HEIGHT = Math.min(contentMinHeight, MAX_HEIGHT);

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startWidthRef.current = attrs.width;
    startHeightRef.current = attrs.height;

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

    setIsResizing(true);
    announceResize("start");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;

      // Stays within the limits, and on graph paper moves a square at a time
      if (direction === "bottom") {
        updateAttributes({
          height: snapLength(startHeightRef.current + deltaY, {
            min: MIN_HEIGHT,
            max: MAX_HEIGHT,
          }),
        });
        return;
      }

      if (!sideLimits) return;

      const width = snapLength(
        startWidthRef.current + (direction === "right" ? deltaX : -deltaX),
        sideLimits,
      );

      if (sideLimits.opensGap) {
        gap = startWidthRef.current - width;
        setResizeGap({ side: direction, size: gap });
      }

      // Saved left text takes what the block gives up, so the block's right
      // edge stays put
      const leftText = row?.leftText;
      if (direction === "left" && leftText && leftText.width !== null) {
        editor.view.dispatch(
          editor.state.tr
            .setNodeAttribute(blockPos, "width", width)
            .setNodeAttribute(
              leftText.pos,
              "width",
              leftText.width + startWidthRef.current - width,
            ),
        );
        return;
      }

      updateAttributes({ width });
    };

    const handleMouseUp = () => {
      if (row && gap > 0 && direction !== "bottom") {
        fillGapWithText(editor, row, direction, gap);
      }

      setResizeGap(null);
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
    resizeGap,
    startResize,
    setContentMinWidth,
    setContentMinHeight,
  };
}
