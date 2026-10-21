import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { DropTarget } from "../FindDropTarget";
import type { DraggedBlock, ScreenPoint } from "../DragState";
import type {
  MeasuredColumn,
  MeasuredWrappedBlock,
} from "../MeasureOtherWrappedBlocks";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { getWidthBeforeColumn } from "../GetWidthBeforeColumn";
import { buildHomeTarget } from "../DragState";
import { buildWrappedBlockDrop } from "./BuildWrappedBlockDrop";

// How wide the strip along the blocks' page edge is, in a wrapped block with
// text on only one side. Dropping there puts the dragged block on that edge
const EDGE_STRIP_WIDTH = 16;

// The parts of the dragged block this needs, plus the page before any
// preview, which the wrapped blocks were measured on
type OtherTargetDragged = Pick<
  DraggedBlock,
  "from" | "node" | "home" | "draggedMinSize" | "otherWrappedBlocks" | "target"
> & { docBeforePreview: ProseMirrorNode };

// A measured wrapped block's blocks, left to right, and whether text sits
// left of all of them or right of all of them
type MeasuredBlocks = {
  blocks: MeasuredColumn[];
  hasTextBefore: boolean;
  hasTextAfter: boolean;
};

// Reads the block columns out of a measured wrapped block
function readMeasuredBlocks({ columns }: MeasuredWrappedBlock): MeasuredBlocks {
  const blocks = columns.filter((column) => column.columnType === "block");
  const firstBlockIndex = columns.indexOf(blocks[0]);
  const lastBlockIndex = columns.lastIndexOf(blocks.at(-1)!);
  return {
    blocks,
    hasTextBefore: firstBlockIndex > 0,
    hasTextAfter: lastBlockIndex < columns.length - 1,
  };
}

// Which gap between the blocks the point is over, 0 [block] 1 [block] 2.
// Each block's center splits the gaps on either side of it. With text on
// only one side, the blocks sit against the other page edge, and only the
// strip along that edge counts as the outer gap there
function getInsertIndex(
  { blocks, hasTextBefore, hasTextAfter }: MeasuredBlocks,
  left: number,
  strip: number,
): number {
  const lastGap = blocks.length;
  const centersPassed = blocks.filter(
    (block) => left >= (block.left + block.right) / 2,
  ).length;

  if (hasTextAfter && !hasTextBefore) {
    return left < blocks[0].left + strip ? 0 : Math.max(centersPassed, 1);
  }
  if (hasTextBefore && !hasTextAfter) {
    return left >= blocks[lastGap - 1].right - strip
      ? lastGap
      : Math.min(centersPassed, lastGap - 1);
  }
  return centersPassed;
}

/**
 * Where the block lands when it's dropped into another wrapped block, in the
 * gap between its blocks the point is over. The wrapped block it turns into
 * is built now and saved, so the drop makes exactly what the preview showed
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block and the wrapped blocks measured at drag start
 * @param snapBlockSide How the page's paper fits block sizes
 * @returns The target, the block's home when it can't be dropped there, or
 * null when the point isn't over another wrapped block
 */
export function findWrappedBlockDropTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: OtherTargetDragged,
  snapBlockSide: SnapBlockSide,
): DropTarget | null {
  const editorRect = view.dom.getBoundingClientRect();
  const top = point.top - editorRect.top;
  const left = point.left - editorRect.left;

  const measuredWrappedBlock = dragged.otherWrappedBlocks.find(
    (otherWrappedBlock) =>
      top >= otherWrappedBlock.top && top < otherWrappedBlock.bottom,
  );
  const wrappedBlock =
    measuredWrappedBlock &&
    dragged.docBeforePreview.nodeAt(measuredWrappedBlock.wrappedBlockStart);
  if (!measuredWrappedBlock || !wrappedBlock) return null;

  const measuredBlocks = readMeasuredBlocks(measuredWrappedBlock);
  if (measuredBlocks.blocks.length === 0) return null;

  // window sizes include any page scaling, so page widths are scaled too
  const scale =
    (measuredWrappedBlock.right - measuredWrappedBlock.left) /
    NOTEBOOK_PAGE_WIDTH;
  const insertIndex = getInsertIndex(
    measuredBlocks,
    left,
    EDGE_STRIP_WIDTH * scale,
  );

  // still over the same gap, so the saved target and the wrapped block it
  // already built are reused instead of building it again on every move
  const savedTarget = dragged.target;
  const savedDrop = savedTarget?.otherWrappedBlockDrop;
  if (
    savedTarget &&
    savedDrop?.wrappedBlockStart === measuredWrappedBlock.wrappedBlockStart &&
    savedDrop.insertIndex === insertIndex
  ) {
    return savedTarget;
  }

  const { blocks } = measuredBlocks;
  const outcome = buildWrappedBlockDrop({
    wrappedBlock,
    insertIndex,
    draggedBlock: dragged.node,
    draggedBlockMinSize: dragged.draggedMinSize,
    existingBlockMinSizes: blocks.map(
      (block) => block.minSize ?? { width: 0, height: 0 },
    ),
    snapBlockSide,
  });
  if (!outcome) return buildHomeTarget(view, dragged.from, dragged.home);

  const offset = getWidthBeforeColumn(
    outcome.wrappedBlock.content.content,
    outcome.draggedColumnIndex,
  );

  // the gap's spot in the page: just before the first block, or just after
  // the block on its left
  const pos = insertIndex === 0 ? blocks[0].pos : blocks[insertIndex - 1].end;
  return {
    pos,
    left: editorRect.left + measuredWrappedBlock.left + offset * scale,
    top: editorRect.top + measuredWrappedBlock.top,
    isHome: false,
    ownWrappedBlockMove: null,
    otherWrappedBlockDrop: {
      wrappedBlockStart: measuredWrappedBlock.wrappedBlockStart,
      insertIndex,
      outcome,
    },
  };
}
