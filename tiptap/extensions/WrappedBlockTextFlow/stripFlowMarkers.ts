import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Fragment, Slice } from "@tiptap/pm/model";
import { withFlowMarker } from "./withFlowMarker";

// The same lines with every flow marker cleared, inside wrapped blocks too
function clearFragment(fragment: Fragment): Fragment {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    nodes.push(
      node.isTextblock
        ? withFlowMarker(node, null)
        : node.copy(clearFragment(node.content)),
    );
  });
  return Fragment.fromArray(nodes);
}

/**
 * Clears the flow markers from pasted content, since pasted text is new
 * and was never pushed out of a wrapped block
 * @param slice The pasted content
 * @returns The content without markers
 */
export function stripFlowMarkers(slice: Slice): Slice {
  return new Slice(
    clearFragment(slice.content),
    slice.openStart,
    slice.openEnd,
  );
}
