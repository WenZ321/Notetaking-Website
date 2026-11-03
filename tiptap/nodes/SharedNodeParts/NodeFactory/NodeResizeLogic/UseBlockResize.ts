import type { Editor } from "@tiptap/core";
import type { CustomBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { MaxBlockSize } from "../ReactNodeFactory";
import type { ResizeSession, ResizeStart } from "./ResizeCases/ResizeSession";
import { useContext, useState } from "react";
import { NotebookPaperTypeContext } from "@/components/NotebookPaperTypes/NotebookPaperTypeContext";
import { getPaperSnapBlockSide } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import { MIN_BLOCK_WIDTH } from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import { getWrappedBlockInfo } from "./GetWrappedBlockInfo";
import { startHeightResize } from "./ResizeCases/StartHeightResize";
import { startWidthResize } from "./ResizeCases/StartWidthResize";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import { readContentMinSize } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import type { BlockResizeMeta } from "@/tiptap/TransactionBehavior";
import {
  BLOCK_RESIZE_META,
  dispatchChange,
} from "@/tiptap/TransactionBehavior";
import { getPageScale } from "@/tiptap/PageScale";

// Resizable block nodes carry an explicit pixel width/height
export type ResizableAttrs = {
  width: number;
  height: number;
};

type ResizeDirection = "bottom" | "right" | "left";

type UseBlockResizeOptions = {
  node: CustomBlockNode;
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
    useContext(NotebookPaperTypeContext),
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
    // the bottom handle changes the height, and a side handle the width
    let session: ResizeSession;
    switch (direction) {
      case "bottom":
        session = startHeightResize(
          start,
          attrs.height,
          { min: MIN_HEIGHT, max: MAX_HEIGHT },
          blockPositionsInWrappedBlock,
        );
        break;
      case "left":
      case "right":
        session = startWidthResize(
          {
            ...start,
            direction,
            startWidth: attrs.width,
            limits: { min: MIN_WIDTH, max: MAX_WIDTH },
          },
          wrappedBlockInfo,
        );
        break;
    }

    // the mouse moves on screen, the size changes in the page's own pixels
    const startX = e.clientX;
    const startY = e.clientY;
    const scale = getPageScale(editor.view);

    setIsResizing(true);
    announceResize("start");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      session.onMove(
        (moveEvent.clientX - startX) / scale,
        (moveEvent.clientY - startY) / scale,
      );
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
