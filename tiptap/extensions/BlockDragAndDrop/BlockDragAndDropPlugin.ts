import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Mapping } from "@tiptap/pm/transform";
import type { ActiveDrag, DragOrigin, DragState } from "./DragState";
import type { DropTarget, PageChange } from "./PageChange";
import { getPageScale } from "@/tiptap/PageScale";
import { isReducedMotion } from "@/components/ReducedMotion/ReducedMotion";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  isCustomBlock,
  readContentMinSize,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import {
  PAGE_FULL_MESSAGE,
  isPastPage,
} from "@/tiptap/extensions/PageFull/PageFit";
import { dispatchChange } from "@/tiptap/TransactionBehavior";
import { blockDragPluginKey, endDrag, setDragState } from "./DragState";
import { measurePage } from "./DragUtils";
import { HOME_TARGET, applyDrop } from "./PageChange";
import { findDrop } from "./FindDrop";
import { hideLiveDropPreview, showLiveDropPreview } from "./LivePreview";
import "./BlockDragAndDrop.css";

/**
 * Makes the drop's page change for real, as one undo step, with the
 * dropped block selected
 * @param view The editor, showing the page from before the drag
 * @param drag The drag
 * @param change The drop's page change
 */
function dropBlock(view: EditorView, drag: ActiveDrag, change: PageChange) {
  const tr = view.state.tr.setMeta(blockDragPluginKey, null);
  const blockPos = applyDrop(tr, drag.origin, change);
  tr.setSelection(NodeSelection.create(tr.doc, blockPos));
  dispatchChange(view, tr, "ownStep");
  // a block from the panel comes from outside the editor
  view.focus();
  settleBlock(view, blockPos);
}

/**
 * Plays the dropped block coming down from where its copy hovered.
 * The block is already drawn, since the drop draws it right away
 * @param view The editor
 * @param blockPos Where the dropped block starts
 */
function settleBlock(view: EditorView, blockPos: number) {
  const blockDom = view.nodeDOM(blockPos);
  if (!blockDom) return;
  if (!(blockDom instanceof HTMLElement) || isReducedMotion()) return;

  blockDom.classList.add("block-settling");
  blockDom.addEventListener(
    "animationend",
    () => blockDom.classList.remove("block-settling"),
    { once: true },
  );
}

/**
 * Takes away a preview that passes the bottom of the page, so letting go
 * there sends the block home. Moving to another spot tries again
 * @param view The editor
 * @param target The drop being shown
 * @param onPageFull Tells the user there's no room
 */
function refuseDropPastPage(
  view: EditorView,
  target: DropTarget,
  onPageFull: (message: string) => void,
) {
  const drag = blockDragPluginKey.getState(view.state);
  if (drag?.target !== target || !isPastPage(view)) return;

  hideLiveDropPreview(view);
  const current = blockDragPluginKey.getState(view.state);
  if (current) {
    setDragState(view, { ...current, target: { ...target, change: null } });
  }
  onPageFull(PAGE_FULL_MESSAGE);
}

/**
 * Moves the drag's spots on the page along with a change it didn't make,
 * like a line the row rules add under a preview, so the hidden original
 * and the shown block stay marked
 * @param drag The drag
 * @param mapping How the change moved the page
 * @returns The drag with its spots moved
 */
function followPageChange(drag: ActiveDrag, mapping: Mapping): ActiveDrag {
  const origin: DragOrigin =
    drag.origin.kind === "page"
      ? { ...drag.origin, from: mapping.map(drag.origin.from) }
      : drag.origin;
  const preview = drag.preview && {
    ...drag.preview,
    copyPos: mapping.map(drag.preview.copyPos),
  };
  return { ...drag, origin, preview };
}

// A see-through picture, used to hide the browser's faded copy of a block
// under the cursor, since the lifted copy on the page already shows the drop
const EMPTY_PICTURE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Whether the pointer is on a custom block. Read as the drag starts, before
 * the editor has selected what's dragged
 * @param view The editor
 * @param event The drag start
 * @returns True when a custom block is under the pointer
 */
function isOnCustomBlock(view: EditorView, event: DragEvent): boolean {
  const spot = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!spot || spot.inside < 0) return false;

  const node = view.state.doc.nodeAt(spot.inside);
  return node !== null && isCustomBlock(node);
}

// Moves custom blocks by dragging. While dragging, the page shows exactly
// what the drop will do, with the block outlined where it lands. Dropped
// blocks fit their size to the page's paper
export function createBlockDragAndDropPlugin(
  snapBlockSide: SnapBlockSide,
  onPageFull: (message: string) => void,
  takeBackDrop: (stateBefore: EditorState) => void,
): Plugin {
  // made when the editor opens, so it's loaded before the first drag
  let emptyPicture: HTMLImageElement | null = null;

  return new Plugin<DragState>({
    key: blockDragPluginKey,

    view: () => {
      emptyPicture = new Image();
      emptyPicture.src = EMPTY_PICTURE;
      return {};
    },

    // The plugin's memory: the drag in progress, or null
    state: {
      init: () => null,
      apply: (tr, drag) => {
        const meta = tr.getMeta(blockDragPluginKey) as DragState | undefined;
        if (meta !== undefined) return meta;
        if (!drag || !tr.docChanged) return drag;
        return followPageChange(drag, tr.mapping);
      },
    },

    props: {
      // Marks the editor while a block is dragged, so the page can outline
      // its blocks and text to show the current layout
      attributes: (state): Record<string, string> =>
        blockDragPluginKey.getState(state)
          ? { class: "is-dragging-block" }
          : {},

      // Hides the original while it's dragged, unless it's going home or
      // the preview moved it along, and outlines the block the preview shows.
      // A block from the panel has no original on the page
      decorations: (state) => {
        const drag = blockDragPluginKey.getState(state);
        if (!drag) return null;

        const { origin, target, preview } = drag;
        const isOriginalShown =
          target !== null &&
          (target.change === null || target.change.includesOriginal);
        const blockSize = drag.block.nodeSize;
        const decorations =
          origin.kind === "panel" || isOriginalShown
            ? []
            : [
                Decoration.node(origin.from, origin.from + blockSize, {
                  class: "block-drag-source",
                }),
              ];
        if (preview) {
          decorations.push(
            Decoration.node(preview.copyPos, preview.copyPos + blockSize, {
              class: "live-drop-preview",
            }),
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },

      // Each one returns false so the editor still handles the drag itself
      handleDOMEvents: {
        dragstart: (view, event) => {
          // only the lifted copy on the page shows the block, not a second
          // faded one under the cursor
          if (emptyPicture && isOnCustomBlock(view, event)) {
            event.dataTransfer?.setDragImage(emptyPicture, 0, 0);
          }

          // Waits a moment, since hiding the original right away cancels the drag
          setTimeout(() => {
            // Only custom blocks are moved this way, so text and inline math drag as usual
            const { selection } = view.state;
            if (!(selection instanceof NodeSelection)) return;
            if (!isCustomBlock(selection.node)) return;

            const blockDom = view.nodeDOM(selection.from);
            if (!(blockDom instanceof HTMLElement)) return;

            // measured while the block still shows, and the drag starts aimed
            // at home, so the block never flashes away
            const origin: DragOrigin = {
              kind: "page",
              startFrom: selection.from,
              from: selection.from,
            };
            setDragState(view, {
              startState: view.state,
              origin,
              block: selection.node,
              blockMinSize: readContentMinSize(view, selection.from),
              grabOffsetX:
                (event.clientX - blockDom.getBoundingClientRect().left) /
                getPageScale(view),
              page: measurePage(view, origin),
              target: HOME_TARGET,
              preview: null,
            });
          });
          return false;
        },

        // Finds the target under the cursor, and shows it when it's a new one
        dragover: (view, event) => {
          const drag = blockDragPluginKey.getState(view.state);
          if (!drag) return false;

          // in the page's own pixels, like the measured page
          const editorRect = view.dom.getBoundingClientRect();
          const scale = getPageScale(view);
          const cursor = {
            left: (event.clientX - editorRect.left) / scale,
            top: (event.clientY - editorRect.top) / scale,
          };
          const target = findDrop(drag, cursor, snapBlockSide);
          if (target?.name === drag.target?.name) return false;

          hideLiveDropPreview(view);
          const current = blockDragPluginKey.getState(view.state);
          if (current) setDragState(view, { ...current, target });

          // a page already too long is left as it is. The preview's block
          // has no height until the next frame, so it's measured then
          const wasPastPage = isPastPage(view);
          if (target?.change) {
            showLiveDropPreview(view, target.change);
            if (!wasPastPage) {
              requestAnimationFrame(() =>
                refuseDropPastPage(view, target, onPageFull),
              );
            }
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

      // Drops at the saved target, the same change the preview shows. The
      // preview is taken away first, so the drop starts from the real page
      // and undo goes straight back to it
      handleDrop: (view) => {
        const drag = blockDragPluginKey.getState(view.state);
        if (!drag) return false;

        hideLiveDropPreview(view);
        const change = drag.target?.change;
        if (!change) {
          endDrag(view);
          return true;
        }

        // letting go right after the preview moved beats its check, and
        // the dropped block has no height until the next frame
        const wasPastPage = isPastPage(view);
        dropBlock(view, drag, change);
        requestAnimationFrame(() => {
          if (!wasPastPage && isPastPage(view)) takeBackDrop(drag.startState);
        });
        return true;
      },
    },
  });
}
