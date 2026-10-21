import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { BlockResizeMeta } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/UseBlockResize";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { BLOCK_RESIZE_META } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/UseBlockResize";
import {
  arrangeTopLevelNode,
  getWrappedBlockTypes,
  isAlreadyArranged,
} from "./ArrangeWrappedBlocks";
import { dispatchChange, markUndoBehavior } from "@/tiptap/TransactionBehavior";

// A label put on a transaction that asks this plugin to check the whole page.
// Sent once when the editor opens, since opening a page changes nothing
export const NORMALIZE_META = "normalizeWrappedBlocks";

// A newspaper whose block is being resized all the way to a page edge. It's
// drawn the way letting go will leave it, wrapped to that side
export type SnapPreview = {
  wrappedBlockPos: number;
  side: "left" | "right";
} | null;

// The plugin's memory: whether a block is being resized, and the newspaper
// shown snapped to a page edge, if any
type LayoutState = {
  isResizing: boolean;
  snapPreview: SnapPreview;
};

// The plugin's name, used to read its memory back out of the editor state
const wrappedBlockLayoutPluginKey = new PluginKey<LayoutState>(
  "wrappedBlockLayout",
);

// Shows a newspaper snapped to a page edge while its block is resized, or
// stops showing it with null, without adding a step to undo
export function setSnapPreview(view: EditorView, snapPreview: SnapPreview) {
  dispatchChange(
    view,
    view.state.tr.setMeta(wrappedBlockLayoutPluginKey, snapPreview),
    "skipUndo",
  );
}

// Enforces the wrapped block rules after every change, e.g. a drag, delete or resize.
// Nodes can't react to changes themselves, and a plugin is the only part
// of the editor that hears about every change, so the rules live here
export function createWrappedBlockLayoutPlugin(): Plugin {
  return new Plugin({
    key: wrappedBlockLayoutPluginKey,

    state: {
      init: (): LayoutState => ({ isResizing: false, snapPreview: null }),

      // Runs for every transaction. The resize start and end labels sent by
      // BlockNodeView and the snap preview change the memory
      apply: (tr, value): LayoutState => {
        const phase = tr.getMeta(BLOCK_RESIZE_META) as
          BlockResizeMeta | undefined;
        if (phase === "start") return { isResizing: true, snapPreview: null };
        if (phase === "end") return { isResizing: false, snapPreview: null };

        const snapPreview = tr.getMeta(wrappedBlockLayoutPluginKey) as
          SnapPreview | undefined;
        if (snapPreview !== undefined) return { ...value, snapPreview };

        const shown = value.snapPreview;
        return shown
          ? {
              ...value,
              snapPreview: {
                ...shown,
                wrappedBlockPos: tr.mapping.map(shown.wrappedBlockPos),
              },
            }
          : value;
      },
    },

    // Marks the newspaper shown snapped, so the CSS can draw it wrapped
    props: {
      decorations: (state) => {
        const snapPreview =
          wrappedBlockLayoutPluginKey.getState(state)?.snapPreview;
        const wrappedBlock =
          snapPreview && state.doc.nodeAt(snapPreview.wrappedBlockPos);
        if (!snapPreview || !wrappedBlock) return null;

        const { wrappedBlockPos, side } = snapPreview;
        return DecorationSet.create(state.doc, [
          Decoration.node(
            wrappedBlockPos,
            wrappedBlockPos + wrappedBlock.nodeSize,
            {
              "data-snap": side,
            },
          ),
        ]);
      },
    },

    // Runs after changes are applied, before the screen updates. The
    // transaction it returns is applied too, so fixes show up instantly
    appendTransaction: (transactions, oldState, newState) => {
      // Waits for the resize to end instead of rebuilding the wrapped block on every drag step
      if (wrappedBlockLayoutPluginKey.getState(newState)?.isResizing) {
        return null;
      }

      // Opening the page or ending a resize changes nothing on its own,
      // so every node gets checked
      const checkAll = transactions.some(
        (tr) =>
          tr.getMeta(NORMALIZE_META) || tr.getMeta(BLOCK_RESIZE_META) === "end",
      );
      const docChanged = transactions.some((tr) => tr.docChanged);
      if (!checkAll && !docChanged) return null;

      // Nodes that didn't change are the exact same objects as before,
      // so only the new or edited ones need checking
      const oldNodes = new Set<ProseMirrorNode>();
      if (!checkAll) oldState.doc.forEach((node) => oldNodes.add(node));

      const wrappedBlockTypes = getWrappedBlockTypes(newState.schema);

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
        const arranged = arrangeTopLevelNode(node, wrappedBlockTypes);

        // Most nodes are already right and are left alone
        if (!isAlreadyArranged(node, arranged)) {
          tr.replaceWith(pos, pos + node.nodeSize, arranged);
        }
      }

      // Text beside a wrapped block is the text after it, so every wrapped
      // block is followed by a line of text to type in
      const missingLines: number[] = [];
      tr.doc.forEach((node, pos, index) => {
        const next =
          index + 1 < tr.doc.childCount ? tr.doc.child(index + 1) : null;
        if (
          node.type === wrappedBlockTypes.wrappedBlockNodeType &&
          !next?.isTextblock
        ) {
          missingLines.push(pos + node.nodeSize);
        }
      });
      for (let i = missingLines.length - 1; i >= 0; i--) {
        tr.insert(
          missingLines[i],
          wrappedBlockTypes.paragraphNodeType.create(),
        );
      }

      // null means there's nothing to fix
      return tr.docChanged ? markUndoBehavior(tr, "joinLastStep") : null;
    },
  });
}
