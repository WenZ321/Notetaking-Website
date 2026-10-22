import type { SnapBlockSide } from "@/components/NotebookTemplates/PaperLogic/PaperSnapping";
import type { DragState } from "./DragState";
import type { DropTarget } from "./FindDropTarget";
import type { LiveDropPreview, ScreenPoint } from "./DragState";
import type { EditorView } from "@tiptap/pm/view";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findDropTarget } from "./FindDropTarget";
import {
  findOwnWrappedBlockTarget,
  measureOwnWrappedBlock,
} from "./FindOwnWrappedBlockTarget";
import { findWrappedBlockDropTarget } from "./WrappedBlockDropLogic/FindWrappedBlockDropTarget";
import { moveIntoWrappedBlock } from "./WrappedBlockDropLogic/MoveIntoWrappedBlock";
import { measureOtherWrappedBlocks } from "./MeasureOtherWrappedBlocks";
import { moveWithinOwnWrappedBlock } from "./MoveWithinOwnWrappedBlock";
import { readContentMinSize } from "./ReadContentMinSize";
import { showLiveDropPreview } from "./LivePreview/ShowLiveDropPreview";
import { hideLiveDropPreview } from "./LivePreview/HideLiveDropPreview";
import {
  blockDragPluginKey,
  buildHomeTarget,
  endDrag,
  findHomeTarget,
  getDragWithBlock,
  measureHome,
  moveBlockToPos,
  setDragState,
} from "./DragState";
import "./BlockDragAndDrop.css";

// How far the ghost can move from where a drop into the text was shown, or
// above the row it's shown in, and still keep the preview. About one line
const SHOWN_COPY_REACH = 24;

/**
 * Whether the ghost is still near a drop into the text shown on the page:
 * over the row the copy is shown in, or within about a line of where it was
 * when the preview was shown. The preview moved the text under it, so the
 * target can't be found again from the page until the preview is taken away
 * @param view The editor
 * @param point The ghost's top edge, in the window
 * @param preview The preview on the page
 * @returns True when the ghost is near the shown copy
 */
function isNearShownCopy(
  view: EditorView,
  point: ScreenPoint,
  preview: LiveDropPreview,
): boolean {
  const editorTop = view.dom.getBoundingClientRect().top;
  const movedSinceShown = Math.abs(point.top - editorTop - preview.shownAtTop);
  if (movedSinceShown < SHOWN_COPY_REACH) return true;

  const $copy = view.state.doc.resolve(preview.copyPos);
  const rowDom = $copy.depth > 0 ? view.nodeDOM($copy.before(1)) : null;
  if (!(rowDom instanceof HTMLElement)) return false;

  const rowRect = rowDom.getBoundingClientRect();
  return (
    point.top >= rowRect.top - SHOWN_COPY_REACH && point.top < rowRect.bottom
  );
}

// Moves custom blocks by dragging. The original hides while it's dragged,
// so the page already looks like it will after the drop. Dropped blocks
// fit their size to the page's paper
export function createBlockDragAndDropPlugin(
  snapBlockSide: SnapBlockSide,
): Plugin {
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
        blockDragPluginKey.getState(state)
          ? { class: "is-dragging-block" }
          : {},

      // Hides the original while it's dragged, so the page looks like it
      // will after the drop, and marks the block a previewed drop shows with
      // a dashed outline. Going back home changes nothing, so the original
      // stays where it is then. A preview that shows the dragged block itself
      // doesn't hide it either
      decorations: (state) => {
        const drag = blockDragPluginKey.getState(state);
        if (!drag) return null;

        const isGoingHome = !!drag.target?.isHome;
        const isShownByPreview = !!drag.preview?.showsDraggedBlock;
        const decorations =
          isGoingHome || isShownByPreview
            ? []
            : [
                Decoration.node(drag.from, drag.to, {
                  class: "block-drag-source",
                }),
              ];
        if (drag.preview) {
          const { copyPos } = drag.preview;
          decorations.push(
            Decoration.node(copyPos, copyPos + (drag.to - drag.from), {
              class: "live-drop-preview",
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
              ownWrappedBlock: null,
              otherWrappedBlocks: [],
              target: null,
              preview: null,
            };
            setDragState(view, drag);

            // measured once the original is hidden, so the wrapped blocks are where
            // they're seen during the drag. The drag then starts aimed at home,
            // which shows the original again before the page is drawn, so it
            // never flashes away
            setDragState(view, {
              ...drag,
              ownWrappedBlock: measureOwnWrappedBlock(view, selection.from),
              otherWrappedBlocks: measureOtherWrappedBlocks(
                view,
                selection.from,
              ),
              target: buildHomeTarget(selection.from),
            });
          });
          return false;
        },

        // Decides the target as the cursor moves, saving it only when it
        // changes so moving within one spot doesn't redraw anything. A drop
        // into another wrapped block is shown on the page until the target changes
        dragover: (view, event) => {
          const startDragged = getDragWithBlock(view.state);
          if (!startDragged || !view.dragging) return false;

          // The ghost's top edge, so the target is found the same way no
          // matter where on the block the drag started
          const point = {
            left: event.clientX,
            top: event.clientY - startDragged.grabOffsetY,
          };

          // While a preview is on the page, only the area it's shown in can
          // change the target without taking it away. Leaving that area
          // takes it away first, since the other checks look at the page as
          // it was. Both areas were measured before any preview
          const preview = startDragged.preview;
          let target: DropTarget | null = null;
          const previewedDrop = preview?.target.otherWrappedBlockDrop;
          if (preview && previewedDrop) {
            target = findWrappedBlockDropTarget(
              view,
              point,
              { ...startDragged, docBeforePreview: preview.docBeforePreview },
              snapBlockSide,
            );
            if (
              target?.otherWrappedBlockDrop?.wrappedBlockStart !==
              previewedDrop.wrappedBlockStart
            ) {
              target = null;
            }
          } else if (preview?.target.ownWrappedBlockMove) {
            target = findOwnWrappedBlockTarget(
              view,
              point,
              startDragged,
              preview.fromBeforePreview,
              startDragged.ownWrappedBlock,
            );
            if (!target?.ownWrappedBlockMove) target = null;
          } else if (preview && isNearShownCopy(view, point, preview)) {
            target = preview.target;
          }
          if (preview && !target) hideLiveDropPreview(view);

          const dragged = getDragWithBlock(view.state);
          if (!dragged) return false;

          const { from, home } = dragged;
          target ??=
            findOwnWrappedBlockTarget(
              view,
              point,
              dragged,
              from,
              dragged.ownWrappedBlock,
            ) ??
            findHomeTarget(view, point, from, home) ??
            findWrappedBlockDropTarget(
              view,
              point,
              { ...dragged, docBeforePreview: view.state.doc },
              snapBlockSide,
            ) ??
            findDropTarget(view, point, view.dragging.slice, dragged);

          const previous = dragged.target;
          if (
            target?.pos !== previous?.pos ||
            target?.isHome !== previous?.isHome ||
            target?.ownWrappedBlockMove?.wrap !==
              previous?.ownWrappedBlockMove?.wrap ||
            target?.ownWrappedBlockMove?.leftTextWidth !==
              previous?.ownWrappedBlockMove?.leftTextWidth
          ) {
            hideLiveDropPreview(view);
            const drag = blockDragPluginKey.getState(view.state);
            if (drag) setDragState(view, { ...drag, target });
          }

          // shown for a new target, or shown again when it was taken away
          // above but the target stayed the same. Going home shows the page
          // as it is, so it needs none
          const isPreviewShown = !!blockDragPluginKey.getState(view.state)
            ?.preview;
          if (target && !target.isHome && !isPreviewShown) {
            const isShown = showLiveDropPreview(
              view,
              target,
              point.top - view.dom.getBoundingClientRect().top,
            );

            // a drop is only allowed where its result is shown, so a spot
            // with no preview isn't a target
            const drag = blockDragPluginKey.getState(view.state);
            if (!isShown && drag) setDragState(view, { ...drag, target: null });
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
            hideLiveDropPreview(view);
            const current = blockDragPluginKey.getState(view.state);
            if (current) setDragState(view, { ...current, target: null });
          }
          return false;
        },

        // A cancelled drag puts the page back as it was
        dragend: (view) => {
          hideLiveDropPreview(view);
          endDrag(view);
          return false;
        },
      },

      // Drops at the saved target, the same one the preview shows. The
      // preview is taken away first, so the drop starts from the real page
      // and undo goes straight back to it
      handleDrop: (view) => {
        hideLiveDropPreview(view);
        const dragged = getDragWithBlock(view.state);
        if (!dragged) return false;

        const { target } = dragged;
        if (target?.ownWrappedBlockMove) {
          moveWithinOwnWrappedBlock(view, target.ownWrappedBlockMove);
        } else if (target?.otherWrappedBlockDrop) {
          moveIntoWrappedBlock(view, target.otherWrappedBlockDrop);
        } else if (target) {
          moveBlockToPos(view, target);
        } else {
          endDrag(view);
        }

        return true;
      },
    },
  });
}
