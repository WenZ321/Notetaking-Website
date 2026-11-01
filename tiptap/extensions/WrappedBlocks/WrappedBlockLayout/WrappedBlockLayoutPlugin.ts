import type { TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { BlockResizeMeta } from "@/tiptap/TransactionBehavior";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { arrangeTopLevelNode } from "./BuildRow";
import {
  BLOCK_RESIZE_META,
  markUndoBehavior,
} from "@/tiptap/TransactionBehavior";

// A label put on a change that asks this plugin to check the whole page.
// Sent once when the editor opens, since opening a page changes nothing
export const NORMALIZE_META = "normalizeWrappedBlocks";

// The plugin's memory: whether a block is being resized
const wrappedBlockLayoutPluginKey = new PluginKey<boolean>(
  "wrappedBlockLayout",
);

// Keeps every row following the row rules after any change, like a delete
// or paste. Our own drops and inserts already build rows right, so for
// those it finds nothing to fix
export function createWrappedBlockLayoutPlugin(): Plugin {
  return new Plugin<boolean>({
    key: wrappedBlockLayoutPluginKey,

    state: {
      init: () => false,
      apply: (tr, isResizing) => {
        const phase = tr.getMeta(BLOCK_RESIZE_META) as
          BlockResizeMeta | undefined;
        if (phase === "start") return true;
        if (phase === "end") return false;
        return isResizing;
      },
    },

    // Runs after changes are applied, before the screen updates, so fixes
    // show up right away
    appendTransaction: (transactions, oldState, newState) => {
      // a resize is checked once when it ends, not on every step
      if (wrappedBlockLayoutPluginKey.getState(newState)) return null;

      // opening the page or ending a resize checks every node
      const checksAll = transactions.some(
        (tr) =>
          tr.getMeta(NORMALIZE_META) || tr.getMeta(BLOCK_RESIZE_META) === "end",
      );
      const docChanged = transactions.some((tr) => tr.docChanged);
      if (!checksAll && !docChanged) return null;

      // nodes that didn't change are the same objects as before, so only
      // new or edited ones are checked
      const oldNodes = new Set<TopLevelNode>();
      if (!checksAll) oldState.doc.forEach((node) => oldNodes.add(node));

      // fixed last to first, so a fix doesn't move the nodes before it
      const tr = newState.tr;
      const changedNodes: { node: TopLevelNode; pos: number }[] = [];
      newState.doc.forEach((node, pos) => {
        if (!oldNodes.has(node)) changedNodes.push({ node, pos });
      });
      for (const { node, pos } of changedNodes.reverse()) {
        const arranged = arrangeTopLevelNode(node, newState.schema);
        const isAlreadyRight = arranged.length === 1 && arranged[0].eq(node);
        if (!isAlreadyRight) tr.replaceWith(pos, pos + node.nodeSize, arranged);
      }

      // text beside a row is the text after it, so every row is followed
      // by a line of text to type in
      const missingLines: number[] = [];
      tr.doc.forEach((node, pos, index) => {
        const next =
          index + 1 < tr.doc.childCount ? tr.doc.child(index + 1) : null;
        if (node.type.name === "WrappedBlock" && !next?.isTextblock) {
          missingLines.push(pos + node.nodeSize);
        }
      });
      for (const pos of missingLines.reverse()) {
        tr.insert(pos, newState.schema.nodes.paragraph.create());
      }

      return tr.docChanged ? markUndoBehavior(tr, "joinLastStep") : null;
    },
  });
}
