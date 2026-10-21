import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// How much room these nodes take up in the page, added together
export function sumNodeSizes(nodes: readonly ProseMirrorNode[]): number {
  return nodes.reduce((sum, node) => sum + node.nodeSize, 0);
}
