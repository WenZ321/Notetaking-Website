import type { BlockSideLimits } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { ResizeSession, ResizeStart } from "./ResizeSession";

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
  const { editor, snapBlockSide, dispatchResize } = start;
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
      dispatchResize(tr);
    },
    onRelease: () => {},
  };
}
