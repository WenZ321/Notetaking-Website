import type { Editor } from "@tiptap/core";
import type { BlockSideLimits } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { WrappedBlockInfo } from "../GetWrappedBlockInfo";
import type { OwnWrappedBlockMove } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import type { ResizeSession, WidthResizeStart } from "./ResizeSession";
import { SNAP_BUFFER, getWantedWidth } from "./ResizeSession";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { MIN_BLOCK_WIDTH } from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import {
  MIN_TEXT_WIDTH,
  getBlocksRoom,
  getNewspaperTextWidths,
  readContentMinSize,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import { setSnapPreview } from "../SnapPreviewPlugin";
import { buildOwnWrappedBlockMove } from "@/tiptap/extensions/BlockDragAndDrop/DropCases/MoveInOwnRow";
import { replaceStretch } from "@/tiptap/extensions/BlockDragAndDrop/PageChange";
import type { UndoBehavior } from "@/tiptap/TransactionBehavior";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

/**
 * Resizes with the left or right handle. How the width changes depends on
 * the block's wrapped block: a handle between two blocks moves the edge
 * they share, a newspaper's block grows into its text and can snap to a
 * page edge, a floated block's handle on its page edge side opens text
 * there and can snap into a newspaper, and a floated block's other handle
 * changes only its width and can snap to fill the page. Each case works out
 * how wide the block can get
 * @param start What a width resize starts from, with the block's own limits
 * @param wrappedBlockInfo The block's wrapped block, or null outside one
 * @returns The resize
 */
export function startWidthResize(
  start: WidthResizeStart,
  wrappedBlockInfo: WrappedBlockInfo | null,
): ResizeSession {
  // the block beside the dragged handle, if the handle is between two blocks
  const blockPositions = wrappedBlockInfo?.blockPositions ?? [];
  const index = blockPositions.indexOf(start.blockPos);
  const neighborIndex = start.direction === "right" ? index + 1 : index - 1;
  const neighborPos = blockPositions[neighborIndex];
  if (neighborPos !== undefined) {
    return resizeBetweenBlocks(start, neighborPos);
  }

  if (wrappedBlockInfo?.wrap === "newspaper") {
    return resizeNewspaperBlock(start, wrappedBlockInfo);
  }

  const isAlone = wrappedBlockInfo?.blockPositions.length === 1;
  if (
    wrappedBlockInfo &&
    isAlone &&
    wrappedBlockInfo.wrap === start.direction
  ) {
    return openTextBesideBlock(start, wrappedBlockInfo);
  }

  return resizeFloatedBlock(start, wrappedBlockInfo);
}

/**
 * Caps how wide a block can get. A block already wider than that, like one
 * made before this rule, isn't made to shrink
 * @param start What a width resize starts from
 * @param widest The widest the case allows
 * @returns The smallest and largest width
 */
function capMaxWidth(start: WidthResizeStart, widest: number): BlockSideLimits {
  const { limits, startWidth } = start;
  const max = Math.max(
    Math.min(limits.max, widest),
    Math.min(limits.max, startWidth),
  );
  return { min: limits.min, max };
}

// <!---- A handle between two blocks ----!>

/**
 * Moves the edge two blocks in a row share, so one gets wider and the other
 * narrower by the same amount and the row's width never changes. The left
 * handle of one block and the right handle of the block before it both
 * move this same edge. Neither block goes below what its content needs
 * @param start What a width resize starts from
 * @param neighborPos Where the block on the other side of the edge starts
 * @returns The resize
 */
function resizeBetweenBlocks(
  start: WidthResizeStart,
  neighborPos: number,
): ResizeSession {
  const { editor, blockPos, startWidth, limits, snapBlockSide } = start;
  const neighborStartWidth = editor.state.doc.nodeAt(neighborPos)!.attrs
    .width as number;
  const neighborMinWidth = Math.max(
    MIN_BLOCK_WIDTH,
    readContentMinSize(editor.view, neighborPos).width,
  );

  // the two blocks share this much, however the edge between them moves
  const sharedWidth = startWidth + neighborStartWidth;
  const widthLimits = {
    min: limits.min,
    max: Math.min(limits.max, sharedWidth - neighborMinWidth),
  };
  let lastWidth = startWidth;
  // the first move starts the undo step, and later ones join it
  let undo: UndoBehavior = "ownStep";

  return {
    onMove: (deltaX) => {
      const width = snapBlockSide(getWantedWidth(start, deltaX), widthLimits);
      if (width === lastWidth) return;
      lastWidth = width;

      dispatchChange(
        editor.view,
        editor.state.tr
          .setNodeAttribute(blockPos, "width", width)
          .setNodeAttribute(neighborPos, "width", sharedWidth - width),
        undo,
      );
      undo = "joinLastStep";
    },
    onRelease: () => {},
  };
}

/**
 * Makes the block's wrapped block the new wrap a snap showed, when it's let
 * go, through the same builder dragging uses, so it ends up exactly as shown
 * @param editor The editor
 * @param blockPos Where the block starts
 * @param move The new wrap
 */
function applySnappedWrap(
  editor: Editor,
  blockPos: number,
  move: OwnWrappedBlockMove,
) {
  setSnapPreview(editor.view, null);

  const change = buildOwnWrappedBlockMove(
    editor.state,
    blockPos,
    move,
    "aboveRow",
  );
  if (!change) return;

  // joins the resize's undo step, so one undo goes back to before the resize
  const tr = editor.state.tr;
  replaceStretch(tr, change, change.start, change.end);
  dispatchChange(editor.view, tr, "joinLastStep");
}

// <!---- A block in a newspaper ----!>

/**
 * Resizes a block that has text on both sides. The block stops when the
 * text on the dragged side is at its smallest. Dragging on past the buffer
 * snaps it to that page edge, drawn the way letting go leaves it: wrapped
 * to that side, with the left text above it and the right text after it.
 * From the left handle the left text takes what the block gives up, so the
 * block's right edge stays put. The right text fills whatever is left
 * @param start What a width resize starts from
 * @param wrappedBlockInfo The block's newspaper and its two text columns
 * @returns The resize
 */
function resizeNewspaperBlock(
  start: WidthResizeStart,
  wrappedBlockInfo: WrappedBlockInfo,
): ResizeSession {
  const {
    editor,
    blockPos,
    direction,
    startWidth,
    snapBlockSide,
    updateAttributes,
  } = start;
  const { textBefore, textAfter, wrappedBlockStart } = wrappedBlockInfo;
  const textOnDraggedSide = direction === "left" ? textBefore : textAfter;

  // the block grows into the text on the dragged side, until that text is
  // at its smallest width
  const textToGive = textOnDraggedSide
    ? Math.max(0, textOnDraggedSide.width - MIN_TEXT_WIDTH)
    : 0;
  const limits = capMaxWidth(start, startWidth + textToGive);

  // snapped, the block reaches the page edge, unless that leaves the text
  // after it less than its smallest width
  const snapAt = limits.max + SNAP_BUFFER;
  const snappedWidth = Math.min(
    start.limits.max,
    getBlocksRoom(direction),
    startWidth + (textOnDraggedSide?.width ?? 0),
  );

  let lastWidth = startWidth;
  let isSnapped = false;
  // the first move starts the undo step, and later ones join it
  let undo: UndoBehavior = "ownStep";

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
          undo,
        );
        undo = "joinLastStep";
        return;
      }

      updateAttributes({ width });
    },

    // letting go while snapped makes it what the preview showed
    onRelease: () => {
      if (isSnapped) {
        applySnappedWrap(editor, blockPos, {
          wrap: direction,
          leftTextWidth: null,
        });
      }
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
 * @param wrappedBlockInfo The block's floated wrapped block
 * @returns The resize
 */
function openTextBesideBlock(
  start: WidthResizeStart,
  wrappedBlockInfo: WrappedBlockInfo,
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
  const { wrappedBlockStart } = wrappedBlockInfo;

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
      if (leftTextWidth !== null) {
        applySnappedWrap(editor, blockPos, {
          wrap: "newspaper",
          leftTextWidth,
        });
      }
    },
  };
}

// <!---- A floated block's other side ----!>

/**
 * Resizes a block wrapped left or right. Only the block's width changes,
 * and the page text beside it wraps around the new width as it's dragged.
 * The block stops when the text beside it is at its smallest. Dragging on
 * past the buffer snaps it to the full width, which leaves no room beside
 * it, so the text all goes below it, the same as after letting go
 * @param start What a width resize starts from
 * @param wrappedBlockInfo The block's floated wrapped block, or null outside one
 * @returns The resize
 */
function resizeFloatedBlock(
  start: WidthResizeStart,
  wrappedBlockInfo: WrappedBlockInfo | null,
): ResizeSession {
  const { startWidth, snapBlockSide, updateAttributes } = start;

  // the row's blocks can grow until together they leave the text beside
  // them its smallest width
  const limits = wrappedBlockInfo
    ? capMaxWidth(
        start,
        getBlocksRoom(wrappedBlockInfo.wrap) -
          wrappedBlockInfo.otherBlocksWidth,
      )
    : start.limits;

  // the full width is what the row's other blocks leave of the page
  const otherBlocksWidth = wrappedBlockInfo?.otherBlocksWidth ?? 0;
  const fullWidth = Math.min(
    start.limits.max,
    NOTEBOOK_PAGE_WIDTH - otherBlocksWidth,
  );
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
