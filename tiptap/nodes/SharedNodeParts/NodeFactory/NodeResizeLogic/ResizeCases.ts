import type { Editor } from "@tiptap/core";
import type {
  BlockSideLimits,
  SnapBlockSide,
} from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { ColumnInfo } from "./GetBlockSurroundings";
import type { ResizableAttrs } from "./UseBlockResize";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

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
  updateAttributes: (attrs: Partial<ResizableAttrs>) => void;
};

// What a resize with the left or right handle also starts from
export type WidthResizeStart = ResizeStart & {
  direction: "left" | "right";
  startWidth: number;
  limits: BlockSideLimits;
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

// <!---- Width in a newspaper ----!>

/**
 * Resizes a block that has text on both sides. From the left handle the
 * left text takes what the block gives up, so the block's right edge stays
 * put. The right text fills whatever is left on its own
 * @param start What a width resize starts from
 * @param textBefore The text column on the block's left
 * @returns The resize
 */
export function startNewspaperWidthResize(
  start: WidthResizeStart,
  textBefore: ColumnInfo,
): ResizeSession {
  const {
    editor,
    blockPos,
    direction,
    startWidth,
    limits,
    snapBlockSide,
    updateAttributes,
  } = start;
  let lastWidth = startWidth;

  return {
    onMove: (deltaX) => {
      const width = snapBlockSide(getWantedWidth(start, deltaX), limits);
      if (width === lastWidth) return;
      lastWidth = width;

      if (direction === "left") {
        dispatchChange(
          editor.view,
          editor.state.tr
            .setNodeAttribute(blockPos, "width", width)
            .setNodeAttribute(
              textBefore.pos,
              "width",
              textBefore.width + startWidth - width,
            ),
          "ownStep",
        );
        return;
      }

      updateAttributes({ width });
    },
    onRelease: () => {},
  };
}

// <!---- Width of a floated block ----!>

/**
 * Resizes a block wrapped left or right. Only the block's width changes,
 * and the page text beside it wraps around the new width as it's dragged
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
