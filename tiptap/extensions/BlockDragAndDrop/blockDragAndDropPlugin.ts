import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "./findDropTarget";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findDropTarget } from "./findDropTarget";
import "./BlockDragAndDrop.css";

// While a block is dragged: where it sits in the page, and where it will land.
// The preview draws this target and the drop uses it, so they always agree
type DragState = {
  from: number;
  to: number;
  target: DropTarget | null;
} | null;

const blockDragPluginKey = new PluginKey<DragState>("blockDragAndDrop");

// The custom block being dragged, where it sits and where it will land, or
// null when nothing or something else is dragged, like text
export function getDraggedBlock(state: EditorState) {
  const drag = blockDragPluginKey.getState(state);
  const node = drag && state.doc.nodeAt(drag.from);
  if (!drag || !node) return null;

  const { width, height } = node.attrs;
  if (typeof width !== "number" || typeof height !== "number") return null;

  return { ...drag, node, width, height };
}

// Saves a new drag state, without adding a step to undo
function setDragState(view: EditorView, drag: DragState) {
  view.dispatch(
    view.state.tr
      .setMeta(blockDragPluginKey, drag)
      .setMeta("addToHistory", false),
  );
}

// Clears the drag, which shows the original again
function endDrag(view: EditorView) {
  if (blockDragPluginKey.getState(view.state)) setDragState(view, null);
}

// Moves the block to the target: removes the original, adds the block at
// the target, and selects it there
function moveBlock(view: EditorView, target: DropTarget) {
  const dragged = getDraggedBlock(view.state);
  if (!dragged) return;

  const { from, to, node } = dragged;

  // dropped onto itself, so nothing moves
  if (target.pos > from && target.pos < to) {
    endDrag(view);
    return;
  }

  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  tr.delete(from, to);

  const insertAt = tr.mapping.map(target.pos);
  tr.insert(insertAt, node);
  tr.setSelection(NodeSelection.create(tr.doc, insertAt));

  view.dispatch(tr);
}

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

            setDragState(view, {
              from: selection.from,
              to: selection.to,
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

          const { from, to, node } = dragged;
          const target = findDropTarget(view, event, view.dragging.slice, {
            from,
            to,
            node,
          });
          if (target?.pos !== dragged.target?.pos) {
            setDragState(view, { from, to, target });
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
