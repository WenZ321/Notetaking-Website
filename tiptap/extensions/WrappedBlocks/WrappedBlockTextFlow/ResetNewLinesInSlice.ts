import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Fragment, Slice } from "@tiptap/pm/model";

// The same lines with every paragraph made a new line, inside wrapped blocks too
function resetFragment(fragment: Fragment): Fragment {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    if (node.attrs.isNewLine === false) {
      nodes.push(
        node.type.create(
          { ...node.attrs, isNewLine: true },
          node.content,
          node.marks,
        ),
      );
    } else {
      nodes.push(node.copy(resetFragment(node.content)));
    }
  });
  return Fragment.fromArray(nodes);
}

/**
 * Makes every pasted paragraph a new line, since pasted text is new and was
 * never cut off from the line above it
 * @param slice The pasted content
 * @returns The content with every paragraph a new line
 */
export function resetNewLinesInSlice(slice: Slice): Slice {
  return new Slice(
    resetFragment(slice.content),
    slice.openStart,
    slice.openEnd,
  );
}
