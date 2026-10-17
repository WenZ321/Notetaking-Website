import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { DropTarget } from "../findDropTarget";
import type { HomeArea, ScreenPoint } from "../dragState";
import type {
  MeasuredColumn,
  MeasuredWrappedBlock,
} from "../measureOtherWrappedBlocks";
import type { MinBlockSize } from "../readContentMinSize";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";
import { getColumnWidth } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { getHomeTarget } from "../dragState";
import { buildOtherWrappedBlockDrop } from "./buildOtherWrappedBlockDrop";

// How wide the strip along a block's page edge is, in a wrapped block with text on
// only one side. Dropping there puts the dragged block on that edge
const EDGE_STRIP_WIDTH = 16;

type OtherWrappedBlockBlock = {
  baseDoc: ProseMirrorNode; // the page before any preview, which the wrapped blocks were measured on
  from: number;
  node: ProseMirrorNode;
  home: HomeArea;
  draggedMinSize: MinBlockSize;
  otherWrappedBlocks: MeasuredWrappedBlock[];
};

type OneBlockWrappedBlock = {
  block: MeasuredColumn;
  hasTextBefore: boolean;
  hasTextAfter: boolean;
};

// The wrapped block's one block and whether text sits before or after it, or null
// when the wrapped block doesn't have exactly one block
function readOneBlockWrappedBlock(
  measuredWrappedBlock: MeasuredWrappedBlock,
): OneBlockWrappedBlock | null {
  const blocks = measuredWrappedBlock.columns.filter(
    (column) => column.columnType === "block",
  );
  if (blocks.length !== 1) return null;

  const block = blocks[0];
  const index = measuredWrappedBlock.columns.indexOf(block);
  return {
    block,
    hasTextBefore: index > 0,
    hasTextAfter: index < measuredWrappedBlock.columns.length - 1,
  };
}

// Which side of the existing block the point is on. With text on both sides
// the block's center splits them. With text on one side, only the strip
// along the block's page edge counts as that edge's side
function getSide(
  { block, hasTextBefore, hasTextAfter }: OneBlockWrappedBlock,
  left: number,
  strip: number,
) {
  const center = (block.left + block.right) / 2;
  if (hasTextBefore && hasTextAfter) return left < center ? "left" : "right";
  if (hasTextAfter) return left < block.left + strip ? "left" : "right";
  if (hasTextBefore) return left >= block.right - strip ? "right" : "left";
  return left < center ? "left" : "right";
}

/**
 * Where the block lands when it's dropped into another wrapped block that has one
 * block, on the left or right of that block. The wrapped block it turns into is
 * built now and saved, so the drop makes exactly what the preview showed
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param dragged The dragged block and the wrapped blocks measured at drag start
 * @param snapBlockSide How the page's paper fits block sizes
 * @returns The target, the block's home when it can't fit there, or null
 * when the point isn't over a one-block wrapped block
 */
export function findOtherWrappedBlockTarget(
  view: EditorView,
  point: ScreenPoint,
  dragged: OtherWrappedBlockBlock,
  snapBlockSide: SnapBlockSide,
): DropTarget | null {
  const editorRect = view.dom.getBoundingClientRect();
  const top = point.top - editorRect.top;
  const left = point.left - editorRect.left;

  const measuredWrappedBlock = dragged.otherWrappedBlocks.find(
    (otherWrappedBlock) =>
      top >= otherWrappedBlock.top && top < otherWrappedBlock.bottom,
  );
  const oneBlockWrappedBlock =
    measuredWrappedBlock && readOneBlockWrappedBlock(measuredWrappedBlock);
  const wrappedBlock =
    measuredWrappedBlock &&
    dragged.baseDoc.nodeAt(measuredWrappedBlock.wrappedBlockStart);
  if (!measuredWrappedBlock || !oneBlockWrappedBlock || !wrappedBlock)
    return null;

  // window sizes include any page scaling, so page widths are scaled too
  const scale =
    (measuredWrappedBlock.right - measuredWrappedBlock.left) /
    NOTEBOOK_PAGE_WIDTH;
  const side = getSide(oneBlockWrappedBlock, left, EDGE_STRIP_WIDTH * scale);
  const insertIndex = side === "left" ? 0 : 1;

  const result = buildOtherWrappedBlockDrop({
    wrappedBlock,
    insertIndex,
    draggedBlock: dragged.node,
    draggedBlockMinSize: dragged.draggedMinSize,
    existingBlockMinSizes: [
      oneBlockWrappedBlock.block.minSize ?? { width: 0, height: 0 },
    ],
    snapBlockSide,
  });
  if (!result) return getHomeTarget(view, dragged.from, dragged.home);

  // the dragged block starts after the columns before it
  const offset = result.wrappedBlock.content.content
    .slice(0, result.draggedColumnIndex)
    .reduce((sum, column) => sum + getColumnWidth(column), 0);

  const { block } = oneBlockWrappedBlock;
  return {
    pos: side === "left" ? block.pos : block.end,
    left: editorRect.left + measuredWrappedBlock.left + offset * scale,
    top: editorRect.top + measuredWrappedBlock.top,
    isHome: false,
    wrappedBlockMove: null,
    wrappedBlockDrop: {
      wrappedBlockStart: measuredWrappedBlock.wrappedBlockStart,
      insertIndex,
      result,
    },
  };
}
