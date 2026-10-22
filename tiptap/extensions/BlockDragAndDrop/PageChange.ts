import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { makeLinesNewAfterDrop } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockTextFlow/MakeLinesNewAfterDrop";

// What a drop does to the page: a stretch of the page swapped for new
// nodes. The preview and the drop both make this same change, so the
// drop always looks exactly like the preview
export type PageChange = {
  start: number; // where the swapped stretch starts, in the page from before the drag
  end: number; // where it ends, the same as start when it only adds
  nodes: ProseMirrorNode[]; // what goes there
  blockOffset: number; // where the dragged block starts among the new nodes
  includesOriginal: boolean; // true when the stretch holds the dragged block, so it moves along instead of being removed
};

// Where a drag will land. Each spot has a name, so moving the cursor
// within one spot doesn't rebuild the preview
export type DropTarget = {
  name: string;
  change: PageChange | null; // null when the block goes back home and nothing changes
};

// Puts the block back where it started
export const HOME_TARGET: DropTarget = { name: "home", change: null };

/**
 * Swaps a stretch of the page for the change's nodes. Every row in them was
 * rearranged, so their cut-off lines no longer rejoin the line above
 * @param tr The change being built
 * @param change The page change
 * @param start Where the stretch starts in the page the change is made on
 * @param end Where it ends in that page
 */
export function replaceStretch(
  tr: Transaction,
  { nodes }: PageChange,
  start: number,
  end: number,
) {
  tr.replaceWith(start, end, nodes);

  let pos = start;
  for (const node of nodes) {
    if (node.type.name === "WrappedBlock") makeLinesNewAfterDrop(tr, pos);
    pos += node.nodeSize;
  }
}
