import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MaxBlockSize } from "../ReactNodeFactory";
import type { WrappedBlockInfo } from "./GetWrappedBlockInfo";
import type { BlockSideLimits } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type {
  ResizeSession,
  ResizeStart,
  WidthResizeStart,
} from "./ResizeCases/ResizeSession";
import { useContext, useState } from "react";
import { NotebookTemplateContext } from "@/components/NotebookTemplates/NotebookTemplateContext";
import { getPaperSnapBlockSide } from "@/components/NotebookTemplates/NotebookTemplates";
import { MIN_BLOCK_WIDTH } from "@/components/NotebookTemplates/PaperLogic/SnapBlockSizeToPaper";
import { getWrappedBlockInfo } from "./GetWrappedBlockInfo";
import { getSideResizeLimits } from "./SideResizeLimits";
import { startHeightResize } from "./ResizeCases/StartHeightResize";
import { startWidthResize } from "./ResizeCases/StartWidthResize";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import { readContentMinSize } from "@/tiptap/extensions/BlockDragAndDrop/ReadContentMinSize";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

export const BLOCK_RESIZE_META = "blockResize";
export type BlockResizeMeta = "start" | "end";

// Resizable block nodes carry an explicit pixel width/height
export type ResizableAttrs = {
  width: number;
  height: number;
};

type ResizeDirection = "bottom" | "right" | "left";

// Making the block taller or shorter
type HeightCase = { kind: "height"; limits: BlockSideLimits };

// Making the block wider or narrower
type WidthCase = {
  kind: "width";
  direction: "left" | "right";
  limits: BlockSideLimits;
};

// Which kind of resize a handle starts, with what that kind needs
type ResizeCase = HeightCase | WidthCase;

/**
 * Works out which kind of resize a handle starts: the bottom handle changes
 * the height, and a side handle changes the width
 * @param direction The handle being dragged
 * @param wrappedBlockInfo The block's wrapped block, or null outside one
 * @param startWidth The block's width when the resize started
 * @param widthLimits The block's own smallest and largest width
 * @param heightLimits The smallest and largest height the wrapped block allows
 * @returns The kind of resize
 */
function getResizeCase(
  direction: ResizeDirection,
  wrappedBlockInfo: WrappedBlockInfo | null,
  startWidth: number,
  widthLimits: BlockSideLimits,
  heightLimits: BlockSideLimits,
): ResizeCase {
  if (direction === "bottom") return { kind: "height", limits: heightLimits };

  const limits = getSideResizeLimits(
    direction,
    wrappedBlockInfo,
    startWidth,
    widthLimits,
  );
  return { kind: "width", direction, limits };
}

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
  const snapBlockSide = getPaperSnapBlockSide(
    useContext(NotebookTemplateContext),
  );

  // Smallest width the preview's content allows, reported by the preview itself
  const [contentMinWidth, setContentMinWidth] = useState(0);

  // Shortest height the preview's content allows, reported by the preview
  // itself. Blocks that don't report keep the usual limit
  const [contentMinHeight, setContentMinHeight] = useState(100);

  // Keeps the outline on while dragging, even if the handle slides out from under the cursor
  const [isResizing, setIsResizing] = useState(false);

  // Sends an empty change labeled "start" or "end" to the editor. The
  // WrappedBlock plugin reads the label to wait until the resize is done
  const announceResize = (phase: BlockResizeMeta) => {
    dispatchChange(
      editor.view,
      editor.state.tr.setMeta(BLOCK_RESIZE_META, phase),
      "skipUndo",
    );
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

    // Every block in the wrapped block shares one height, so it can't go below what
    // any of their contents need
    const wrappedBlockInfo = getWrappedBlockInfo(editor.state, blockPos);
    const blockPositionsInWrappedBlock = wrappedBlockInfo?.blockPositions ?? [
      blockPos,
    ];
    const wrappedBlockMinHeight = Math.max(
      contentMinHeight,
      ...blockPositionsInWrappedBlock
        .filter((pos) => pos !== blockPos)
        .map((pos) => readContentMinSize(editor.view, pos).height),
    );

    const MIN_WIDTH = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    const MAX_WIDTH = maxSize.maxWidth;
    const MAX_HEIGHT = maxSize.maxHeight;
    const MIN_HEIGHT = Math.min(wrappedBlockMinHeight, MAX_HEIGHT);

    const start: ResizeStart = {
      editor,
      blockPos,
      snapBlockSide,
      updateAttributes,
    };
    const resizeCase = getResizeCase(
      direction,
      wrappedBlockInfo,
      attrs.width,
      { min: MIN_WIDTH, max: MAX_WIDTH },
      { min: MIN_HEIGHT, max: MAX_HEIGHT },
    );

    // Side handles keep the block's other edge where it is
    const widthStart = (widthCase: WidthCase): WidthResizeStart => ({
      ...start,
      direction: widthCase.direction,
      startWidth: attrs.width,
      limits: widthCase.limits,
    });

    let session: ResizeSession;
    switch (resizeCase.kind) {
      case "height":
        session = startHeightResize(
          start,
          attrs.height,
          resizeCase.limits,
          blockPositionsInWrappedBlock,
        );
        break;
      case "width":
        session = startWidthResize(
          widthStart(resizeCase),
          wrappedBlockInfo,
          MAX_WIDTH,
        );
        break;
    }

    const startX = e.clientX;
    const startY = e.clientY;

    setIsResizing(true);
    announceResize("start");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      session.onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
    };

    const handleMouseUp = () => {
      session.onRelease();

      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      announceResize("end");

      // a newspaper's text that no longer fits beside the new size is pushed
      // down, once the new size is drawn
      if (wrappedBlockInfo?.wrap === "newspaper") {
        const { wrappedBlockStart } = wrappedBlockInfo;
        requestAnimationFrame(() =>
          flowWrappedBlockText(editor.view, wrappedBlockStart),
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return {
    isResizing,
    contentMinWidth,
    contentMinHeight,
    startResize,
    setContentMinWidth,
    setContentMinHeight,
  };
}
