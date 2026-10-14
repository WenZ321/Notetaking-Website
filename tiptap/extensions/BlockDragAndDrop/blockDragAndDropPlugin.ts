import type { SnapLength } from "@/components/NotebookTemplates/PaperLogic/paperSnapping";
import type { DragState } from "./dragState";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findDropTarget } from "./findDropTarget";
import { findOwnRowTarget } from "./findOwnRowTarget";
import { findOtherRowTarget } from "./OtherRowDrop/findOtherRowTarget";
import { moveIntoOtherRow } from "./OtherRowDrop/moveIntoOtherRow";
import { measureOtherRows } from "./measureOtherRows";
import { moveWithinOwnRow } from "./moveWithinOwnRow";
import { readContentMinSize } from "./readContentMinSize";
import { showRowPreview } from "./LivePreview/showRowPreview";
import { hideRowPreview } from "./LivePreview/hideRowPreview";
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
// so the page already looks like it will after the drop. Dropped blocks
// fit their size to the page's paper
export function createBlockDragAndDropPlugin(snapLength: SnapLength): Plugin {
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
      // Marks the editor while a block is dragged, so the page can outline
      // its blocks and text to show the current layout
      attributes: (state): Record<string, string> =>
        blockDragPluginKey.getState(state) ? { class: "is-dragging-block" } : {},

      // Hides the original while it's dragged, and marks the copy a
      // previewed drop puts on the page
      decorations: (state) => {
        const drag = blockDragPluginKey.getState(state);
        if (!drag) return null;

        const decorations = [
          Decoration.node(drag.from, drag.to, { class: "block-drag-source" }),
        ];
        if (drag.preview) {
          const { copyPos } = drag.preview;
          decorations.push(
            Decoration.node(copyPos, copyPos + (drag.to - drag.from), {
              class: "block-drop-preview",
            }),
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },

      // Each one returns false so the editor still handles the drag itself
      handleDOMEvents: {
        dragstart: (view, event) => {
          // Waits a moment, since hiding the original right away cancels the drag
          setTimeout(() => {
            // Only custom blocks have a size, so text and inline math drag as usual
            const { selection } = view.state;
            if (!(selection instanceof NodeSelection)) return;
            if (typeof selection.node.attrs.height !== "number") return;

            // measured now, while the original is still showing
            const home = measureHome(view, selection.from);
            if (!home) return;

            const editorRect = view.dom.getBoundingClientRect();
            const drag = {
              from: selection.from,
              to: selection.to,
              home,
              grabOffsetX: event.clientX - (editorRect.left + home.left),
              grabOffsetY: event.clientY - (editorRect.top + home.top),
              draggedMinSize: readContentMinSize(view, selection.from),
              otherRows: [],
              target: null,
              preview: null,
            };
            setDragState(view, drag);

            // measured once the original is hidden, so the rows are where
            // they're seen during the drag
            setDragState(view, {
              ...drag,
              otherRows: measureOtherRows(view, selection.from),
            });
          });
          return false;
        },

        // Decides the target as the cursor moves, saving it only when it
        // changes so moving within one spot doesn't redraw anything. A drop
        // into another row is shown on the page until the target changes
        dragover: (view, event) => {
          const startDragged = getDraggedBlock(view.state);
          if (!startDragged || !view.dragging) return false;

          // The ghost's top edge, so the target is found the same way no
          // matter where on the block the drag started
          const point = {
            left: event.clientX,
            top: event.clientY - startDragged.grabOffsetY,
          };

          // While a preview is on the page, only that row's sides can
          // change the target without it. Leaving the row takes it away
          // first, since the other checks look at the page as it was
          const preview = startDragged.preview;
          let target = preview
            ? findOtherRowTarget(
                view,
                point,
                { ...startDragged, baseDoc: preview.baseDoc },
                snapLength,
              )
            : null;
          if (preview && target?.rowDrop?.rowStart !== preview.rowDrop.rowStart) {
            hideRowPreview(view);
            target = null;
          }

          const dragged = getDraggedBlock(view.state);
          if (!dragged) return false;

          const { from, home } = dragged;
          target ??=
            findOwnRowTarget(view, point, dragged) ??
            findHomeTarget(view, point, from, home) ??
            findOtherRowTarget(
              view,
              point,
              { ...dragged, baseDoc: view.state.doc },
              snapLength,
            ) ??
            findDropTarget(view, point, view.dragging.slice, dragged);

          const previous = dragged.target;
          if (
            target?.pos !== previous?.pos ||
            target?.isHome !== previous?.isHome ||
            target?.rowMove?.side !== previous?.rowMove?.side ||
            target?.rowMove?.leftTextWidth !== previous?.rowMove?.leftTextWidth
          ) {
            hideRowPreview(view);
            const drag = blockDragPluginKey.getState(view.state);
            if (drag) setDragState(view, { ...drag, target });
            if (target?.rowDrop) showRowPreview(view, target.rowDrop);
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
            hideRowPreview(view);
            const current = blockDragPluginKey.getState(view.state);
            if (current) setDragState(view, { ...current, target: null });
          }
          return false;
        },

        // A cancelled drag puts the page back as it was
        dragend: (view) => {
          hideRowPreview(view);
          endDrag(view);
          return false;
        },
      },

      // Drops at the saved target, the same one the preview shows. The
      // preview is taken away first, so the drop starts from the real page
      // and undo goes straight back to it
      handleDrop: (view) => {
        hideRowPreview(view);
        const dragged = getDraggedBlock(view.state);
        if (!dragged) return false;

        const { target } = dragged;
        if (target?.rowMove) {
          moveWithinOwnRow(view, target.rowMove);
        } else if (target?.rowDrop) {
          moveIntoOtherRow(view, target.rowDrop);
        } else if (target) {
          moveBlock(view, target);
        } else {
          endDrag(view);
        }

        return true;
      },
    },
  });
}
