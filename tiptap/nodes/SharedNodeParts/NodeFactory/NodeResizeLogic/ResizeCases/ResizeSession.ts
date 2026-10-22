import type { Editor } from "@tiptap/core";
import type {
  BlockSideLimits,
  SnapBlockSide,
} from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { ResizableAttrs } from "../UseBlockResize";

// How one resize follows the mouse, and what it does when it's let go
export type ResizeSession = {
  onMove: (deltaX: number, deltaY: number) => void;
  onRelease: () => void;
};

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

// How far the handle has to go past where a resize would change the wrap
// before it snaps to the new wrap, so it doesn't happen by accident
export const SNAP_BUFFER = 60;

// The width the mouse asks for. Moving right grows the block from the
// right handle but shrinks it from the left one
export function getWantedWidth(
  start: WidthResizeStart,
  deltaX: number,
): number {
  const growth = start.direction === "right" ? deltaX : -deltaX;
  return start.startWidth + growth;
}
