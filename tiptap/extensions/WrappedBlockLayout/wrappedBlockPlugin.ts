import type { Node as ProseMirrorNode, NodeType } from "@tiptap/pm/model";
import type { BlockResizeMeta } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/BlockNodeView";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { BLOCK_RESIZE_META } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/BlockNodeView";
import type { RowTypes } from "./arrangeWrappedBlocks";
import { arrangeTopLevelNode, isUnchanged } from "./arrangeWrappedBlocks";

// A label put on a transaction that asks this plugin to check the whole page.
// Sent once when the editor opens, since opening a page changes nothing
export const NORMALIZE_META = "normalizeWrappedBlocks";

// The plugin's name, used to read its memory back out of the editor state
const wrappedBlockPluginKey = new PluginKey<{ isResizing: boolean }>(
  "wrappedBlock",
);

// Enforces the row rules after every change, e.g. a drag, delete or resize.
// Nodes can't react to changes themselves, and a plugin is the only part
// of the editor that hears about every change, so the rules live here
export function createWrappedBlockPlugin(wrappedBlockType: NodeType): Plugin {
  return new Plugin({
    key: wrappedBlockPluginKey,

    // The plugin's memory: whether a block is being resized right now
    state: {
      init: () => ({ isResizing: false }),

      // Runs for every transaction; only the resize start and end labels
      // sent by BlockNodeView change the memory
      apply: (tr, value) => {
        const phase = tr.getMeta(BLOCK_RESIZE_META) as
          BlockResizeMeta | undefined;

        if (phase === "start") return { isResizing: true };
        if (phase === "end") return { isResizing: false };
        return value;
      },
    },

    // Runs after changes are applied, before the screen updates. The
    // transaction it returns is applied too, so fixes show up instantly
    appendTransaction: (transactions, oldState, newState) => {
      // Waits for the resize to end instead of rebuilding the row on every drag step
      if (wrappedBlockPluginKey.getState(newState)?.isResizing) {
        return null;
      }

      // Opening the page or ending a resize changes nothing on its own,
      // so every node gets checked
      const checkAll = transactions.some(
        (tr) =>
          tr.getMeta(NORMALIZE_META) ||
          tr.getMeta(BLOCK_RESIZE_META) === "end",
      );
      const docChanged = transactions.some((tr) => tr.docChanged);
      if (!checkAll && !docChanged) return null;

      // Nodes that didn't change are the exact same objects as before,
      // so only the new or edited ones need checking
      const oldNodes = new Set<ProseMirrorNode>();
      if (!checkAll) oldState.doc.forEach((node) => oldNodes.add(node));

      const rowTypes: RowTypes = {
        rowNodeType: wrappedBlockType,
        columnNodeType: newState.schema.nodes.WrappedColumn,
        paragraphNodeType: newState.schema.nodes.paragraph,
      };

      // The top-level nodes to check and where each one starts
      const topLevelNodes: { node: ProseMirrorNode; pos: number }[] = [];
      newState.doc.forEach((node, pos) => {
        if (!oldNodes.has(node)) topLevelNodes.push({ node, pos });
      });

      // The fix-up transaction; stays empty if nothing needs fixing
      const tr = newState.tr;

      // Goes last to first, so replacing a node doesn't shift
      // the positions of the nodes before it
      for (let i = topLevelNodes.length - 1; i >= 0; i--) {
        const { node, pos } = topLevelNodes[i];

        // What this node should look like under the column rules
        const arranged = arrangeTopLevelNode(node, rowTypes);

        // Most nodes are already right and are left alone
        if (!isUnchanged(node, arranged)) {
          tr.replaceWith(pos, pos + node.nodeSize, arranged);
        }
      }

      // null means there's nothing to fix
      return tr.docChanged ? tr : null;
    },
  });
}
