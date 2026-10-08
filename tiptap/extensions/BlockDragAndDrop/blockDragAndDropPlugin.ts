import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { DropTarget } from "./findDropTarget";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findDropTarget } from "./findDropTarget";
import "./BlockDragAndDrop.css";

// The area the block covered before the drag, measured from the editor's
// top left corner so scrolling during the drag doesn't throw it off
type HomeArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// While a block is dragged: where it sits in the page, the area it came
// from, and where it will land. The preview draws this target and the drop
// uses it, so they always agree
type DragState = {
  from: number;
  to: number;
  home: HomeArea;
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

// Measures the block's area before it's hidden, from the editor's corner
function measureHome(view: EditorView, from: number): HomeArea | null {
  const blockDom = view.nodeDOM(from);
  if (!(blockDom instanceof HTMLElement)) return null;

  const blockRect = blockDom.getBoundingClientRect();
  const editorRect = view.dom.getBoundingClientRect();

  return {
    left: blockRect.left - editorRect.left,
    top: blockRect.top - editorRect.top,
    width: blockRect.width,
    height: blockRect.height,
  };
}

// How much of the block's old area, centered in it, sends the block home.
// Smaller than the whole block so the content that moved in stays reachable
const HOME_AREA_FRACTION = 0.5;

// The target for going back home when the cursor is near the middle of the
// block's old area, which takes priority over whatever moved into that space
function findHomeTarget(
  view: EditorView,
  event: DragEvent,
  from: number,
  home: HomeArea,
): DropTarget | null {
  const editorRect = view.dom.getBoundingClientRect();
  const left = editorRect.left + home.left;
  const top = editorRect.top + home.top;

  // the centered part of the old area that counts as home
  const marginX = (home.width * (1 - HOME_AREA_FRACTION)) / 2;
  const marginY = (home.height * (1 - HOME_AREA_FRACTION)) / 2;

  const isOverHome =
    event.clientX >= left + marginX &&
    event.clientX <= left + home.width - marginX &&
    event.clientY >= top + marginY &&
    event.clientY <= top + home.height - marginY;

  return isOverHome ? { pos: from, left, top, isHome: true } : null;
}

// Moves the block to the target: removes the original, adds the block at
// the target, and selects it there
function moveBlock(view: EditorView, target: DropTarget) {
  const dragged = getDraggedBlock(view.state);
  if (!dragged) return;

  const { from, to, node } = dragged;

  // dropped back home or onto itself, so nothing moves
  if (target.isHome || (target.pos > from && target.pos < to)) {
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
