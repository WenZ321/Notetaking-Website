import type { Editor } from "@tiptap/core";
import type {
  BlockSideLimits,
  SnapBlockSide,
} from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { BlockSurroundings, ColumnInfo } from "./GetBlockSurroundings";
import type { SideResizeLimits } from "./SideResizeLimits";
import type { ResizableAttrs } from "./UseBlockResize";
import { RESIZE_BUFFER } from "./SideResizeLimits";
import {
  addTextColumnOnResize,
  getMovedTextColumnPreview,
  moveTextColumnOnResize,
} from "./ResizeTextChanges";
import { setMovedTextColumnPreview } from "@/tiptap/extensions/MovedTextColumnPreview/MovedTextColumnPreviewPlugin";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// Extra space on one side of the block while resizing. A gap opened on a
// side with no text is positive, and the block laid over a text column it
// will move is negative
export type ResizeMargin = {
  side: "left" | "right";
  size: number;
};

// How one resize follows the mouse, and what it does when it's let go
export type ResizeSession = {
  onMove: (deltaX: number, deltaY: number) => void;
  onRelease: () => void;
};

// What every resize starts from
export type ResizeStart = {
  editor: Editor;
  blockPos: number;
  snapBlockSide: SnapBlockSide;
  setResizeMargin: (margin: ResizeMargin | null) => void;
  updateAttributes: (attrs: Partial<ResizableAttrs>) => void;
};

// What a resize with the left or right handle also starts from
export type WidthResizeStart = ResizeStart & {
  direction: "left" | "right";
  startWidth: number;
  limits: SideResizeLimits;
};

// The width the mouse asks for. Moving right grows the block from the
// right handle but shrinks it from the left one
function getWantedWidth(start: WidthResizeStart, deltaX: number): number {
  const growth = start.direction === "right" ? deltaX : -deltaX;
  return start.startWidth + growth;
}

// <!---- Height ----!>

/**
 * Resizes with the bottom handle. Every block in the wrapped block takes the
 * new height together
 * @param start What every resize starts from
 * @param startHeight The block's height when the resize started
 * @param limits The smallest and largest height
 * @param blockPositions Where every block in the wrapped block starts
 * @returns The resize
 */
export function startHeightResize(
  start: ResizeStart,
  startHeight: number,
  limits: BlockSideLimits,
  blockPositions: number[],
): ResizeSession {
  const { editor, snapBlockSide } = start;
  let lastHeight = startHeight;

  return {
    onMove: (_deltaX, deltaY) => {
      const height = snapBlockSide(startHeight + deltaY, limits);
      if (height === lastHeight) return;
      lastHeight = height;

      const tr = editor.state.tr;
      blockPositions.forEach((pos) =>
        tr.setNodeAttribute(pos, "height", height),
      );
      dispatchChange(editor.view, tr, "ownStep");
    },
    onRelease: () => {},
  };
}

// <!---- Width into text ----!>

/**
 * Resizes into the text column beside the block. The block stops when the
 * text is at its smallest, and dragging on past the buffer shows the text
 * column moved out, which happens when it's let go
 * @param start What a width resize starts from
 * @param surroundings What's around the block in its wrapped block
 * @param pushedText The text column the block grows into
 * @param maxWidth The block's own largest width
 * @returns The resize
 */
export function startPushTextResize(
  start: WidthResizeStart,
  surroundings: BlockSurroundings,
  pushedText: ColumnInfo,
  maxWidth: number,
): ResizeSession {
  const {
    editor,
    blockPos,
    direction,
    startWidth,
    limits,
    snapBlockSide,
    setResizeMargin,
    updateAttributes,
  } = start;
  const widthAfterMove = Math.min(maxWidth, startWidth + pushedText.width);
  let lastWidth = startWidth;
  let movesTextColumn = false;

  return {
    onMove: (deltaX) => {
      const wantedWidth = getWantedWidth(start, deltaX);
      const wasMovingTextColumn = movesTextColumn;
      movesTextColumn =
        limits.moveTextColumnAt !== null &&
        wantedWidth >= limits.moveTextColumnAt;

      // Past the buffer the block shows its final width, laid over the text
      // it will move, so the wrapped block keeps its layout until letting go
      const width = snapBlockSide(wantedWidth, limits);
      const shownWidth = movesTextColumn ? widthAfterMove : width;
      if (shownWidth === lastWidth && movesTextColumn === wasMovingTextColumn)
        return;
      lastWidth = shownWidth;

      if (movesTextColumn !== wasMovingTextColumn) {
        setMovedTextColumnPreview(
          editor.view,
          movesTextColumn
            ? getMovedTextColumnPreview(surroundings, direction)
            : null,
        );
      }
      setResizeMargin(
        movesTextColumn ? { side: direction, size: width - shownWidth } : null,
      );

      // From the left handle the pushed text is the text before, which takes
      // what the block gives up, so the block's right edge stays put
      if (direction === "left") {
        dispatchChange(
          editor.view,
          editor.state.tr
            .setNodeAttribute(blockPos, "width", shownWidth)
            .setNodeAttribute(
              pushedText.pos,
              "width",
              pushedText.width + startWidth - width,
            ),
          "ownStep",
        );
        return;
      }

      updateAttributes({ width: shownWidth });
    },
    onRelease: () => {
      if (!movesTextColumn) return;
      setMovedTextColumnPreview(editor.view, null);
      moveTextColumnOnResize(
        editor,
        surroundings,
        direction,
        blockPos,
        widthAfterMove,
      );
    },
  };
}

// <!---- Width opening a gap ----!>

/**
 * Resizes smaller on a side with no text. Once the drag passes the buffer,
 * the space the block gives up shows as a gap, which becomes an empty text
 * column when it's let go
 * @param start What a width resize starts from
 * @param surroundings What's around the block in its wrapped block
 * @returns The resize
 */
export function startOpenGapResize(
  start: WidthResizeStart,
  surroundings: BlockSurroundings,
): ResizeSession {
  const {
    editor,
    direction,
    startWidth,
    limits,
    snapBlockSide,
    setResizeMargin,
    updateAttributes,
  } = start;
  let lastWidth = startWidth;
  let gap = 0;

  return {
    onMove: (deltaX) => {
      const wantedWidth = getWantedWidth(start, deltaX);

      // A gap only opens once the drag passes the buffer
      const isWithinGapBuffer = startWidth - wantedWidth < RESIZE_BUFFER;
      const width = isWithinGapBuffer
        ? startWidth
        : snapBlockSide(wantedWidth, limits);
      if (width === lastWidth) return;
      lastWidth = width;

      gap = startWidth - width;
      setResizeMargin(gap > 0 ? { side: direction, size: gap } : null);
      updateAttributes({ width });
    },
    onRelease: () => {
      if (gap > 0) addTextColumnOnResize(editor, surroundings, direction, gap);
    },
  };
}

// <!---- Width only ----!>

/**
 * Resizes with nothing beside the block to push or open, like a block on
 * its own or next to other blocks. It only changes the block's width
 * @param start What a width resize starts from
 * @returns The resize
 */
export function startFreeWidthResize(start: WidthResizeStart): ResizeSession {
  const { startWidth, limits, snapBlockSide, updateAttributes } = start;
  let lastWidth = startWidth;

  return {
    onMove: (deltaX) => {
      const width = snapBlockSide(getWantedWidth(start, deltaX), limits);
      if (width === lastWidth) return;
      lastWidth = width;
      updateAttributes({ width });
    },
    onRelease: () => {},
  };
}
