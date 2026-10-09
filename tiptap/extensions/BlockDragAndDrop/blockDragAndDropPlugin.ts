import type { DragState } from "./dragState";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findDropTarget } from "./findDropTarget";
import {
  blockDragPluginKey,
  endDrag,
  findHomeTarget,
  getDraggedBlock,
  measureHome,
  moveBlock,
  setDragState,
} from "./dragState";
import "./BlockDragAndDrop.css";

// Moves custom blocks by dragging. The original hides while it's dragged,
// so the page already looks like it will after the drop
export function createBlockDragAndDropPlugin(): Plugin {
  return new Plugin<DragState>({
    key: blockDragPluginKey,

    // The plugin's memory: the drag in progress, or null
    state: {
      init: () => null,
      apply: (tr, drag) => {
        const meta = tr.getMeta(blockDragPluginKey) as DragState | undefined;
        return meta === undefined ? drag : meta;
      },
    },

    props: {
      // Hides the original while it's dragged
      decorations: (state) => {
        const drag = blockDragPluginKey.getState(state);
        if (!drag) return null;

        return DecorationSet.create(state.doc, [
          Decoration.node(drag.from, drag.to, { class: "block-drag-source" }),
        ]);
      },

      // Each one returns false so the editor still handles the drag itself
      handleDOMEvents: {
        dragstart: (view) => {
          // Waits a moment, since hiding the original right away cancels the drag
          setTimeout(() => {
            // Only custom blocks have a size, so text and inline math drag as usual
            const { selection } = view.state;
            if (!(selection instanceof NodeSelection)) return;
            if (typeof selection.node.attrs.height !== "number") return;

            // measured now, while the original is still showing
            const home = measureHome(view, selection.from);
            if (!home) return;

            setDragState(view, {
              from: selection.from,
              to: selection.to,
              home,
              target: null,
            });
          });
          return false;
        },

        // Decides the target as the cursor moves, saving it only when it
        // changes so moving within one spot doesn't redraw anything
        dragover: (view, event) => {
          const dragged = getDraggedBlock(view.state);
          if (!dragged || !view.dragging) return false;

          const { from, to, node, home } = dragged;
          const target =
            findHomeTarget(view, event, from, home) ??
            findDropTarget(view, event, view.dragging.slice, {
              from,
              to,
              node,
            });

          const previous = dragged.target;
          if (
            target?.pos !== previous?.pos ||
            target?.isHome !== previous?.isHome
          ) {
            setDragState(view, { from, to, home, target });
          }
          return false;
        },

        // Moving between parts of the page also fires this, so the target
        // only clears once the cursor leaves the editor
        dragleave: (view, event) => {
          const drag = blockDragPluginKey.getState(view.state);
          const leftEditor = !view.dom.contains(
            event.relatedTarget as Node | null,
          );

          if (drag?.target && leftEditor) {
            setDragState(view, { ...drag, target: null });
          }
          return false;
        },

        dragend: (view) => {
          endDrag(view);
          return false;
        },
      },

      // Drops at the saved target, the same one the preview shows
      handleDrop: (view) => {
        const dragged = getDraggedBlock(view.state);
        if (!dragged) return false;

        if (dragged.target) {
          moveBlock(view, dragged.target);
        } else {
          endDrag(view);
        }

        return true;
      },
    },
  });
}
