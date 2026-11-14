import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type {
  BlockSideLimits,
  SnapBlockSide,
} from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type {
  BlockResizeMeta,
  UndoBehavior,
} from "@/tiptap/TransactionBehavior";
import {
  BLOCK_RESIZE_META,
  dispatchChange,
} from "@/tiptap/TransactionBehavior";

// How one resize follows the mouse, and what it does when it's let go
export type ResizeSession = {
  onMove: (deltaX: number, deltaY: number) => void;
  onRelease: () => void;
};

export type ResizeStart = {
  editor: Editor;
  blockPos: number;
  snapBlockSide: SnapBlockSide;
  // one per resize, so a corner's width and height share one undo step
  dispatchResize: (tr: Transaction) => void;
};

// What a resize with the left or right handle also starts from
export type WidthResizeStart = ResizeStart & {
  direction: "left" | "right";
  startWidth: number;
  limits: BlockSideLimits;
};

// How far the handle has to go past where a resize would change the wrap
// before it snaps to the new wrap, so it doesn't happen by accident
export const SNAP_BUFFER = 60;

// Sends an empty change labeled "start" or "end" to the editor. The
// WrappedBlock plugin reads the label to wait until the resize is done.
// The row rules fix the row in a change added onto the "end" one, and undo
// skips whatever is added onto a skipped change, so "end" joins the resize
export function announceResize(view: EditorView, phase: BlockResizeMeta) {
  dispatchChange(
    view,
    view.state.tr.setMeta(BLOCK_RESIZE_META, phase),
    phase === "end" ? "joinLastStep" : "skipUndo",
  );
}

// Puts a resize's changes on the page. The first starts the undo step and
// later ones join it, so one undo takes back the whole resize however slow
export function createResizeDispatch(view: EditorView) {
  let undo: UndoBehavior = "ownStep";
  return (tr: Transaction) => {
    dispatchChange(view, tr, undo);
    undo = "joinLastStep";
  };
}

// Runs two resizes as one, like a corner changing width and height together
export function joinResizes(
  first: ResizeSession,
  second: ResizeSession,
): ResizeSession {
  return {
    onMove: (deltaX, deltaY) => {
      first.onMove(deltaX, deltaY);
      second.onMove(deltaX, deltaY);
    },
    onRelease: () => {
      first.onRelease();
      second.onRelease();
    },
  };
}

// The width the mouse asks for. Moving right grows the block from the
// right handle but shrinks it from the left one
export function getWantedWidth(
  start: WidthResizeStart,
  deltaX: number,
): number {
  const growth = start.direction === "right" ? deltaX : -deltaX;
  return start.startWidth + growth;
}
