import type { Editor } from "@tiptap/core";
import type {
  BlockSideLimits,
  SnapBlockSide,
} from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { BlockSurroundings } from "./GetBlockSurroundings";
import type { ResizableAttrs } from "./UseBlockResize";
import {
  MIN_TEXT_WIDTH,
  getBlocksRoom,
  getNewspaperTextWidths,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/ArrangeWrappedBlocks";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { setSnapPreview } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/WrappedBlockLayoutPlugin";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";
import { buildOwnWrappedBlockMove } from "@/tiptap/extensions/BlockDragAndDrop/MoveWithinOwnWrappedBlock";
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

// How far the handle has to go past where a resize would change the wrap
// before it snaps to the new wrap, so it doesn't happen by accident
const SNAP_BUFFER = 60;

/**
 * Resizes a block that has text on both sides. The block stops when the
 * text on the dragged side is at its smallest. Dragging on past the buffer
 * snaps it to that page edge, drawn the way letting go leaves it: wrapped
 * to that side, with the left text above it and the right text after it.
 * From the left handle the left text takes what the block gives up, so the
 * block's right edge stays put. The right text fills whatever is left
 * @param start What a width resize starts from
 * @param surroundings The block's newspaper and its two text columns
 * @param maxWidth The block's own largest width
 * @returns The resize
 */
export function startNewspaperWidthResize(
  start: WidthResizeStart,
  surroundings: BlockSurroundings,
  maxWidth: number,
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
  const { textBefore, textAfter, wrappedBlockStart } = surroundings;
  const textOnDraggedSide = direction === "left" ? textBefore : textAfter;

  // snapped, the block reaches the page edge, unless that leaves the text
  // after it less than its smallest width
  const snapAt = limits.max + SNAP_BUFFER;
  const snappedWidth = Math.min(
    maxWidth,
    getBlocksRoom(direction),
    startWidth + (textOnDraggedSide?.width ?? 0),
  );

  let lastWidth = startWidth;
  let isSnapped = false;

  return {
    onMove: (deltaX) => {
      const wantedWidth = getWantedWidth(start, deltaX);
      const wasSnapped = isSnapped;
      isSnapped = textOnDraggedSide !== null && wantedWidth >= snapAt;

      const width = isSnapped
        ? snappedWidth
        : snapBlockSide(wantedWidth, limits);
      if (width === lastWidth && isSnapped === wasSnapped) return;
      lastWidth = width;

      if (isSnapped !== wasSnapped) {
        setSnapPreview(
          editor.view,
          isSnapped
            ? { wrappedBlockPos: wrappedBlockStart, side: direction }
            : null,
        );
      }

      if (direction === "left" && textBefore && !isSnapped) {
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

    // letting go while snapped makes it what the preview showed
    onRelease: () => {
      if (!isSnapped) return;
      setSnapPreview(editor.view, null);

      const outcome = buildOwnWrappedBlockMove(editor.state, blockPos, {
        wrap: direction,
        leftTextWidth: null,
      });
      if (!outcome) return;

      const tr = editor.state.tr.replaceWith(
        outcome.start,
        outcome.end,
        outcome.nodes,
      );
      // the text is rearranged, so cut-off lines no longer rejoin the line above
      makeLinesNewAfterDrop(tr, outcome.wrappedBlockStart);
      dispatchChange(editor.view, tr, "ownStep");
    },
  };
}

// <!---- Opening text beside a floated block ----!>

/**
 * Resizes a block wrapped left or right from its page edge side, keeping
 * its other edge put so a gap opens between it and the page edge. After the
 * buffer it snaps into a newspaper, with a gap at least as wide as the
 * smallest text as its left text, drawn the way letting go leaves it, with
 * the page text below. Before that the block doesn't move
 * @param start What a width resize starts from
 * @param surroundings The block's floated wrapped block
 * @returns The resize
 */
export function startOpenTextResize(
  start: WidthResizeStart,
  surroundings: BlockSurroundings,
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
  const { wrappedBlockStart } = surroundings;

  // the opened text has to be at least the smallest text width, and the
  // block can't get narrower than its own smallest width for that
  const widestOpen = startWidth - MIN_TEXT_WIDTH;
  const canOpen = widestOpen >= limits.min;

  // where the block's left edge sits on the page, which a block on the
  // right keeps, so its left text is what's left of it
  const blockLeft = direction === "left" ? 0 : NOTEBOOK_PAGE_WIDTH - startWidth;

  let lastWidth = startWidth;
  let leftTextWidth: number | null = null;

  return {
    onMove: (deltaX) => {
      const wantedWidth = getWantedWidth(start, deltaX);
      const isOpen = canOpen && startWidth - wantedWidth >= SNAP_BUFFER;
      const width = isOpen
        ? snapBlockSide(wantedWidth, { min: limits.min, max: widestOpen })
        : startWidth;

      const wasOpen = leftTextWidth !== null;
      const wantedLeftText =
        direction === "left" ? startWidth - width : blockLeft;
      const [newLeftTextWidth] = getNewspaperTextWidths(width, wantedLeftText);
      if (width === lastWidth && isOpen === wasOpen) return;
      lastWidth = width;
      leftTextWidth = isOpen ? newLeftTextWidth : null;

      setSnapPreview(
        editor.view,
        isOpen
          ? {
              wrappedBlockPos: wrappedBlockStart,
              side: "newspaper",
              leftTextWidth: newLeftTextWidth,
            }
          : null,
      );
      updateAttributes({ width });
    },

    // letting go while open makes it the newspaper the preview showed
    onRelease: () => {
      if (leftTextWidth === null) return;
      setSnapPreview(editor.view, null);

      const outcome = buildOwnWrappedBlockMove(editor.state, blockPos, {
        wrap: "newspaper",
        leftTextWidth,
      });
      if (!outcome) return;

      const tr = editor.state.tr.replaceWith(
        outcome.start,
        outcome.end,
        outcome.nodes,
      );
      makeLinesNewAfterDrop(tr, outcome.wrappedBlockStart);
      dispatchChange(editor.view, tr, "ownStep");
    },
  };
}

// <!---- Width of a floated block ----!>

/**
 * Resizes a block wrapped left or right. Only the block's width changes,
 * and the page text beside it wraps around the new width as it's dragged.
 * The block stops when the text beside it is at its smallest. Dragging on
 * past the buffer snaps it to the full width, which leaves no room beside
 * it, so the text all goes below it, the same as after letting go
 * @param start What a width resize starts from
 * @param fullWidth The widest the block can be with nothing beside it
 * @returns The resize
 */
export function startFreeWidthResize(
  start: WidthResizeStart,
  fullWidth: number,
): ResizeSession {
  const { startWidth, limits, snapBlockSide, updateAttributes } = start;
  const canSnap = limits.max < fullWidth;
  const snapAt = limits.max + SNAP_BUFFER;
  let lastWidth = startWidth;

  return {
    onMove: (deltaX) => {
      const wantedWidth = getWantedWidth(start, deltaX);
      const isSnapped = canSnap && wantedWidth >= snapAt;
      const width = isSnapped ? fullWidth : snapBlockSide(wantedWidth, limits);
      if (width === lastWidth) return;
      lastWidth = width;
      updateAttributes({ width });
    },
    onRelease: () => {},
  };
}
