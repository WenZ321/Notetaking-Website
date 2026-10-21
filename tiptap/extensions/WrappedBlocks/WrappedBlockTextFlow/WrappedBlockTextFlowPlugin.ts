import type { EditorState, Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { BLOCK_RESIZE_META } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/UseBlockResize";
import {
  LIVE_DROP_PREVIEW_META,
  blockDragPluginKey,
} from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { HISTORY_KEY } from "@/tiptap/extensions/BlockDragAndDrop/LivePreview/ReadHistoryState";
import { flowWrappedBlockText } from "./FlowWrappedBlockText";

// Put on the changes this extension makes, so it doesn't react to its own
export const WRAPPED_BLOCK_FLOW_META = "wrappedBlockTextFlow";

// The plugin's memory: whether a block is being resized, and the wrapped block an
// edit just changed that needs its text checked
type FlowState = {
  isResizing: boolean;
  wrappedBlockToCheck: number | null;
};

const wrappedBlockTextFlowPluginKey = new PluginKey<FlowState>(
  "wrappedBlockTextFlow",
);

// The wrapped block the cursor is in, or null when it's in plain text on the page
function findCursorWrappedBlock(state: EditorState): number | null {
  const { $head } = state.selection;
  for (let depth = $head.depth; depth > 0; depth--) {
    if ($head.node(depth).type.name === "WrappedBlock")
      return $head.before(depth);
  }
  return null;
}

// Only the user's own edits move text. Undo, drags, previews, resizes and
// this plugin's own moves are left alone
function isUserEdit(tr: Transaction, state: EditorState, isResizing: boolean) {
  return (
    tr.docChanged &&
    !isResizing &&
    !tr.getMeta(WRAPPED_BLOCK_FLOW_META) &&
    !tr.getMeta(LIVE_DROP_PREVIEW_META) &&
    !tr.getMeta(HISTORY_KEY) &&
    !blockDragPluginKey.getState(state)
  );
}

// Keeps a newspaper's text beside its blocks as the user types: extra lines
// are pushed down, from the left column to the right one, then under the blocks
export function createWrappedBlockTextFlowPlugin(): Plugin {
  return new Plugin<FlowState>({
    key: wrappedBlockTextFlowPluginKey,

    state: {
      init: () => ({ isResizing: false, wrappedBlockToCheck: null }),
      apply: (tr, { isResizing }, _oldState, newState) => {
        const phase = tr.getMeta(BLOCK_RESIZE_META);
        const resizing =
          phase === "start" ? true : phase === "end" ? false : isResizing;

        return {
          isResizing: resizing,
          wrappedBlockToCheck: isUserEdit(tr, newState, resizing)
            ? findCursorWrappedBlock(newState)
            : null,
        };
      },
    },

    // Runs once the edit is drawn, since lines can only be measured on the
    // page. Waits for the next frame, since new blocks are drawn a moment
    // after the change, and skips while a typed character is being composed
    view: () => ({
      update: (view) => {
        const { wrappedBlockToCheck } =
          wrappedBlockTextFlowPluginKey.getState(view.state) ?? {};
        if (wrappedBlockToCheck == null || view.composing) return;

        requestAnimationFrame(() => {
          const current = wrappedBlockTextFlowPluginKey.getState(view.state);
          if (
            !view.isDestroyed &&
            current?.wrappedBlockToCheck === wrappedBlockToCheck
          ) {
            flowWrappedBlockText(view, wrappedBlockToCheck);
          }
        });
      },
    }),
  });
}
