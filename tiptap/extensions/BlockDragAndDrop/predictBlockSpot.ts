import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { RowTypes } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";
import { arrangeTopLevelNode } from "@/tiptap/extensions/WrappedBlockLayout/arrangeWrappedBlocks";

// The dragged block and where it sits now
type DraggedBlock = {
  from: number;
  to: number;
  node: ProseMirrorNode;
};

// How far from the row's left edge a block column starts. Every column
// saves its width, so it's the widths of the columns before it added up
function getColumnOffset(row: ProseMirrorNode, block: ProseMirrorNode): number {
  let offset = 0;
  for (const column of row.content.content) {
    if (column.firstChild === block) return offset;
    offset += column.attrs.width ?? 0;
  }
  return 0;
}

/**
 * Predicts where a dropped block will end up once the row rules arrange it,
 * by running those same rules on a copy of the page with the block moved
 * @param view The editor
 * @param pos Where the block is inserted
 * @param dragged The dragged block
 * @returns The block's top left corner in the window
 */
export function predictBlockSpot(
  view: EditorView,
  pos: number,
  dragged: DraggedBlock,
): { left: number; top: number } {
  const { state } = view;
  const contentLeft = view.dom.getBoundingClientRect().left;
  const insertSpot = view.coordsAtPos(pos);

  // A drop between top level nodes starts a new row right at that spot
  const $pos = state.doc.resolve(pos);
  if ($pos.depth === 0) return { left: contentLeft, top: insertSpot.top };

  // The page with the block moved, before the row rules run
  const tr = state.tr.delete(dragged.from, dragged.to);
  const insertAt = tr.mapping.map(pos);
  tr.insert(insertAt, dragged.node);
  const changedTopLevel = tr.doc.child(tr.doc.resolve(insertAt).index(0));

  const rowTypes: RowTypes = {
    rowNodeType: state.schema.nodes.WrappedBlock,
    columnNodeType: state.schema.nodes.WrappedColumn,
    paragraphNodeType: state.schema.nodes.paragraph,
  };
  const arranged = arrangeTopLevelNode(changedTopLevel, rowTypes);

  const rowIndex = arranged.findIndex(
    (node) =>
      node.type === rowTypes.rowNodeType &&
      node.content.content.some((column) => column.firstChild === dragged.node),
  );
  if (rowIndex === -1) return { left: insertSpot.left, top: insertSpot.top };

  // The top level node the block was dropped into, as it looks now
  const topLevelDom = view.nodeDOM($pos.before(1));
  if (!(topLevelDom instanceof HTMLElement)) {
    return { left: insertSpot.left, top: insertSpot.top };
  }
  const topLevelRect = topLevelDom.getBoundingClientRect();
  const offset = getColumnOffset(arranged[rowIndex], dragged.node);

  // window positions include any page scaling, so the offset is scaled too
  const scale =
    view.dom.getBoundingClientRect().width / view.dom.offsetWidth || 1;

  // The block stays in that row, or gets pushed onto its own row just below
  return {
    left: contentLeft + offset * scale,
    top: rowIndex === 0 ? topLevelRect.top : topLevelRect.bottom,
  };
}
