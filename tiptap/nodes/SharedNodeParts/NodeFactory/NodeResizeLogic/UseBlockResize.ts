import type { Editor } from "@tiptap/core";
import type { CustomBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { MaxBlockSize } from "../ReactNodeFactory";
import type { ResizeSession, ResizeStart } from "./ResizeCases/ResizeSession";
import { useContext, useState } from "react";
import { NotebookPaperTypeContext } from "@/components/NotebookPaperTypes/NotebookPaperTypeContext";
import { getPaperSnapBlockSide } from "@/components/NotebookPaperTypes/NotebookPaperTypes";
import {
  DEFAULT_CONTENT_MIN_HEIGHT,
  MIN_BLOCK_WIDTH,
} from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import { getWrappedBlockInfo } from "./GetWrappedBlockInfo";
import {
  isPastPage,
  readRoomLeft,
  takeBackChange,
} from "@/tiptap/extensions/PageFull/PageFit";
import {
  announceResize,
  createResizeDispatch,
  joinResizes,
} from "./ResizeCases/ResizeSession";
import { startHeightResize } from "./ResizeCases/StartHeightResize";
import { startWidthResize } from "./ResizeCases/StartWidthResize";
import { flowWrappedBlockText } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/FlowWrappedBlockText";
import {
  readContentMinSize,
  readMaxBlockHeight,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { getPageScale } from "@/tiptap/PageScale";

// Resizable block nodes carry an explicit pixel width/height
export type ResizableAttrs = {
  width: number;
  height: number;
};

// a bottom corner changes the width and the height together
type ResizeDirection =
  "bottom" | "right" | "left" | "bottom-left" | "bottom-right";

type UseBlockResizeOptions = {
  node: CustomBlockNode;
  editor: Editor;
  maxSize: MaxBlockSize;
  getPos: () => number | undefined;
};

// Resizes a block with its bottom, left and right handles and its two
// bottom corners, keeping it on the paper and keeping the edges that
// aren't dragged where they are
export function useBlockResize({
  node,
  editor,
  maxSize,
  getPos,
}: UseBlockResizeOptions) {
  const snapBlockSide = getPaperSnapBlockSide(
    useContext(NotebookPaperTypeContext),
  );

  // Smallest width the preview's content allows, reported by the preview itself
  const [contentMinWidth, setContentMinWidth] = useState(0);

  // Shortest height the preview's content allows, reported by the preview
  // itself. Blocks that don't report keep the usual limit
  const [contentMinHeight, setContentMinHeight] = useState(
    DEFAULT_CONTENT_MIN_HEIGHT,
  );

  // Keeps the corners on while dragging, even if the handle slides out from under the cursor
  const [isResizing, setIsResizing] = useState(false);

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
    const { blockPositions } = wrappedBlockInfo;
    const otherBlocks = blockPositions.filter((pos) => pos !== blockPos);
    const wrappedBlockMinHeight = Math.max(
      contentMinHeight,
      ...otherBlocks.map((pos) => readContentMinSize(editor.view, pos).height),
    );

    // and any block can grow the row as far as its tallest block allows
    const wrappedBlockMaxHeight = Math.max(
      maxSize.maxHeight,
      ...otherBlocks.map((pos) => readMaxBlockHeight(editor.view, pos)),
    );

    // the mouse moves on screen, the size changes in the page's own pixels
    const scale = getPageScale(editor.view);

    const MIN_WIDTH = Math.max(MIN_BLOCK_WIDTH, contentMinWidth);
    const MAX_WIDTH = maxSize.maxWidth;
    // grabbing a row taller than its limit never jumps it shorter, and it
    // can only grow by the room left on the page
    const roomLeft = Math.max(0, readRoomLeft(editor.view) / scale);
    const MAX_HEIGHT = Math.min(
      Math.max(wrappedBlockMaxHeight, attrs.height),
      attrs.height + roomLeft,
    );
    const MIN_HEIGHT = Math.min(wrappedBlockMinHeight, MAX_HEIGHT);

    const start: ResizeStart = {
      editor,
      blockPos,
      snapBlockSide,
      dispatchResize: createResizeDispatch(editor.view),
    };
    const resizeHeight = () =>
      startHeightResize(
        start,
        attrs.height,
        { min: MIN_HEIGHT, max: MAX_HEIGHT },
        blockPositions,
      );
    const resizeWidth = (side: "left" | "right") =>
      startWidthResize(
        {
          ...start,
          direction: side,
          startWidth: attrs.width,
          limits: { min: MIN_WIDTH, max: MAX_WIDTH },
        },
        wrappedBlockInfo,
      );

    // the bottom handle changes the height, a side handle the width, and a
    // bottom corner both, each stopping at its own limit
    let session: ResizeSession;
    switch (direction) {
      case "bottom":
        session = resizeHeight();
        break;
      case "left":
      case "right":
        session = resizeWidth(direction);
        break;
      case "bottom-left":
        session = joinResizes(resizeWidth("left"), resizeHeight());
        break;
      case "bottom-right":
        session = joinResizes(resizeWidth("right"), resizeHeight());
        break;
    }

    const startX = e.clientX;
    const startY = e.clientY;

    // a resize can also push the text around it past the page, which only
    // shows once it's done. A page already too long is left as it is
    const stateBefore = editor.state;
    const wasPastPage = isPastPage(editor.view);

    setIsResizing(true);
    announceResize(editor.view, "start");
    // keeps the resize cursor on the whole page until it's let go
    document.documentElement.dataset.resizing = direction;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      session.onMove(
        (moveEvent.clientX - startX) / scale,
        (moveEvent.clientY - startY) / scale,
      );
    };

    const handleMouseUp = () => {
      session.onRelease();

      setIsResizing(false);
      delete document.documentElement.dataset.resizing;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      announceResize(editor.view, "end");

      // once the new size is drawn, a newspaper's text that no longer fits
      // beside it is pushed down, then the page is checked
      requestAnimationFrame(() => {
        if (wrappedBlockInfo.wrap === "newspaper") {
          flowWrappedBlockText(editor.view, wrappedBlockInfo.wrappedBlockStart);
        }
        if (!wasPastPage && isPastPage(editor.view)) {
          takeBackChange(editor, stateBefore);
        }
      });
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
