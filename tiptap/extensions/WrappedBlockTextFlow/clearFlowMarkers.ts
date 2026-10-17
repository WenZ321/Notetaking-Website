import type { Transaction } from "@tiptap/pm/state";
import { WRAPPED_BLOCK_FLOW_ATTR } from "./wrappedBlockFlowMarker";

/**
 * Clears the flow markers in a wrapped block and in the pushed lines right after it.
 * Used when a drop rebuilds the wrapped block, since a drop is a one-time move and
 * the old pushed text shouldn't flow into the new layout
 * @param tr The change that rebuilt the wrapped block
 * @param wrappedBlockPos Where the wrapped block starts in the changed page
 */
export function clearFlowMarkers(tr: Transaction, wrappedBlockPos: number) {
  const wrappedBlock = tr.doc.nodeAt(wrappedBlockPos);
  if (!wrappedBlock) return;

  const wrappedBlockEnd = wrappedBlockPos + wrappedBlock.nodeSize;
  tr.doc.nodesBetween(wrappedBlockPos, wrappedBlockEnd, (node, pos) => {
    if (node.attrs[WRAPPED_BLOCK_FLOW_ATTR])
      tr.setNodeAttribute(pos, WRAPPED_BLOCK_FLOW_ATTR, null);
  });

  // the pushed lines wait right after the wrapped block, one after another
  let pos = wrappedBlockEnd;
  let line = tr.doc.nodeAt(pos);
  while (line?.attrs[WRAPPED_BLOCK_FLOW_ATTR]) {
    tr.setNodeAttribute(pos, WRAPPED_BLOCK_FLOW_ATTR, null);
    pos += line.nodeSize;
    line = tr.doc.nodeAt(pos);
  }
}
