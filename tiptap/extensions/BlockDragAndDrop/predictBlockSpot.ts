import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { DraggedBlock } from "./dragState";
import {
  arrangeTopLevelNode,
  getColumnWidth,
  getWrappedBlockTypes,
} from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

// How far from the wrapped block's left edge a block column starts, which is the
// widths of the columns before it added up
function getColumnOffset(
  wrappedBlock: ProseMirrorNode,
  block: ProseMirrorNode,
): number {
  let offset = 0;
  for (const column of wrappedBlock.content.content) {
    if (column.firstChild === block) return offset;
    offset += getColumnWidth(column);
  }
  return 0;
}

/**
 * Predicts where a dropped block will end up once the wrapped block rules arrange it,
 * by running those same rules on a copy of the page with the block moved
 * @param view The editor
 * @param pos Where the block is inserted
 * @param dragged The dragged block
 * @returns The block's top left corner in the window
 */
export function predictBlockSpot(
  view: EditorView,
  pos: number,
  dragged: Pick<DraggedBlock, "from" | "to" | "node">,
): { left: number; top: number } {
  const { state } = view;
  const contentLeft = view.dom.getBoundingClientRect().left;
  const insertSpot = view.coordsAtPos(pos);

  // A drop between top level nodes starts a new wrapped block right at that spot
  const $pos = state.doc.resolve(pos);
  if ($pos.depth === 0) return { left: contentLeft, top: insertSpot.top };

  // The page with the block moved, before the wrapped block rules run
  const tr = state.tr.delete(dragged.from, dragged.to);
  const insertAt = tr.mapping.map(pos);
  tr.insert(insertAt, dragged.node);
  const changedTopLevel = tr.doc.child(tr.doc.resolve(insertAt).index(0));

  const wrappedBlockTypes = getWrappedBlockTypes(state.schema);
  const arranged = arrangeTopLevelNode(changedTopLevel, wrappedBlockTypes);

  const wrappedBlockIndex = arranged.findIndex(
    (node) =>
      node.type === wrappedBlockTypes.wrappedBlockNodeType &&
      node.content.content.some((column) => column.firstChild === dragged.node),
  );
  if (wrappedBlockIndex === -1)
    return { left: insertSpot.left, top: insertSpot.top };

  // The top level node the block was dropped into, as it looks now
  const topLevelDom = view.nodeDOM($pos.before(1));
  if (!(topLevelDom instanceof HTMLElement)) {
    return { left: insertSpot.left, top: insertSpot.top };
  }
  const topLevelRect = topLevelDom.getBoundingClientRect();
  const offset = getColumnOffset(arranged[wrappedBlockIndex], dragged.node);

  // window positions include any page scaling, so the offset is scaled too
  const scale =
    view.dom.getBoundingClientRect().width / view.dom.offsetWidth || 1;

  // The block stays in that wrapped block, or gets pushed onto its own wrapped block just below
  return {
    left: contentLeft + offset * scale,
    top: wrappedBlockIndex === 0 ? topLevelRect.top : topLevelRect.bottom,
  };
}
