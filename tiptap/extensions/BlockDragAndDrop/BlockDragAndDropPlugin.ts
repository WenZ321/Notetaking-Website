import type { SnapBlockSide } from "@/components/NotebookPaperTypes/PaperLogic/PaperSnapping";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Mapping } from "@tiptap/pm/transform";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { ActiveDrag, DragOrigin, DragState } from "./DragState";
import type { DropTarget, PageChange } from "./PageChange";
import { getPageScale } from "@/tiptap/PageScale";
import { isReducedMotion } from "@/components/ReducedMotion/ReducedMotion";
import { NodeSelection, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  isCustomBlock,
  isTextColumn,
  readContentMinSize,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import {
  PAGE_FULL_MESSAGE,
  isPastPage,
  removeEmptyLinesPastPage,
} from "@/tiptap/extensions/PageFull/PageFit";
import { dispatchChange } from "@/tiptap/TransactionBehavior";
import {
  DROP_PREVIEW_SPEC,
  LIVE_DROP_PREVIEW_META,
  blockDragPluginKey,
  endDrag,
  setDragState,
} from "./DragState";
import { measurePage } from "./DragUtils";
import { HOME_TARGET, applyDrop } from "./PageChange";
import { findDrop } from "./FindDrop";
import { hideLiveDropPreview, showLiveDropPreview } from "./LivePreview";
import { startDropSpotBox } from "./DropSpotBox";
import { clearSettleSway, feedSway, keepSwayForSettle } from "./DragSway";
import {
  clearGhostSettle,
  hasDragGhost,
  keepGhostSpotForSettle,
  moveDragGhost,
  removeDragGhost,
  showDragGhost,
} from "./DragGhost";
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
  settleBlock(view);
}

/**
 * The block that was just dropped. Found by the selection, since the drop
 * selects it and the row rules can move or redraw it right after
 * @param view The editor
 * @returns The block, or null when it can't be found
 */
function readDroppedBlockDom(view: EditorView): HTMLElement | null {
  const { selection } = view.state;
  if (!(selection instanceof NodeSelection)) return null;

  const dom = view.nodeDOM(selection.from);
  return dom && dom instanceof HTMLElement ? dom : null;
}

/**
 * Plays the dropped block flying down from where the ghost was, and
 * turning back straight from its lean. The block is already drawn, since
 * the drop draws it right away. A block from the panel had no ghost, so
 * it just shows in its spot
 * @param view The editor
 */
function settleBlock(view: EditorView) {
  const blockDom = readDroppedBlockDom(view);
  if (!blockDom || isReducedMotion()) {
    removeDragGhost(view);
    return;
  }
  if (!hasDragGhost(view)) return;

  // read now, since the lean clears itself on the next frame
  keepSwayForSettle(view);
  // the dropped block is only laid out by the next frame, so it's measured
  // then. Until that, the ghost stays put and the block is hidden
  blockDom.classList.add("block-landing");
  requestAnimationFrame(() => {
    blockDom.classList.remove("block-landing");
    // found again, since it can be redrawn in the meantime
    const landed = readDroppedBlockDom(view);
    if (!landed) {
      removeDragGhost(view);
      return;
    }
    if (!keepGhostSpotForSettle(view, landed)) return;

    landed.classList.add("block-settling");
    landed.addEventListener(
      "animationend",
      () => {
        landed.classList.remove("block-settling");
        clearSettleSway(view);
        clearGhostSettle(view);
      },
      { once: true },
    );
  });
}

/**
 * Whether a row has nothing but empty text once its dragged block leaves.
 * After the drop that text is just empty lines, which a full page pushes off
 * @param row The dragged block's row
 * @param blockColumnIndex Which of its columns holds the dragged block
 * @returns True when every other column is a text column with one empty line
 */
function isLeftOnlyEmptyText(row: ProseMirrorNode, blockColumnIndex: number) {
  return row.content.content.every(
    (column, index) =>
      index === blockColumnIndex ||
      (isTextColumn(column) &&
        column.childCount === 1 &&
        column.firstChild!.content.size === 0),
  );
}

// Puts the page back as it was before a cancelled drag
function cancelDrag(view: EditorView) {
  removeDragGhost(view);
  hideLiveDropPreview(view);
  endDrag(view);
}

/**
 * Pushes the empty lines at the end of the page off its bottom, since a
 * drop only needs room for real content
 * @param view The editor
 * @param isPreview Whether it's for the drop shown while dragging, which
 * isn't saved or undone, rather than the real drop
 * @returns Whether the page fits after
 */
function fitsWithoutEmptyLinesPastPage(
  view: EditorView,
  isPreview: boolean,
): boolean {
  const tr = removeEmptyLinesPastPage(view);
  if (tr && isPreview) {
    dispatchChange(view, tr.setMeta(LIVE_DROP_PREVIEW_META, true), "skipUndo");
  } else if (tr) {
    dispatchChange(view, tr, "joinLastStep");
  }
  return !isPastPage(view);
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
  if (fitsWithoutEmptyLinesPastPage(view, true)) return;

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
// under the cursor, since the ghost already follows the cursor
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
  // the drag whose page was measured with its block hidden
  let measuredDragStart: EditorState | null = null;

  // Finds the target under the cursor, and shows it when it's a new one
  function aimAtCursor(view: EditorView, event: DragEvent) {
    let drag = blockDragPluginKey.getState(view.state);
    if (!drag) return;
    // measured again with the block hidden at the drag's first move, since
    // hiding it while the drag is still starting can end the drag
    if (drag.origin.kind === "page" && measuredDragStart !== drag.startState) {
      measuredDragStart = drag.startState;
      drag = { ...drag, page: measurePage(view, drag.origin, true) };
      setDragState(view, drag);
    }
    feedSway(view, event.clientX);
    moveDragGhost(view, event.clientX, event.clientY);
    startDropSpotBox(view);

    // in the page's own pixels, like the measured page
    const editorRect = view.dom.getBoundingClientRect();
    const scale = getPageScale(view);
    const cursor = {
      left: (event.clientX - editorRect.left) / scale,
      top: (event.clientY - editorRect.top) / scale,
    };
    const target = findDrop(drag, cursor, snapBlockSide);
    if (target?.name === drag.target?.name) return;

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
  }

  // Drops at the saved target, the same change the preview shows. The
  // preview is taken away first, so the drop starts from the real page
  // and undo goes straight back to it. Returns false when nothing is dragged
  function dropAtTarget(view: EditorView): boolean {
    const drag = blockDragPluginKey.getState(view.state);
    if (!drag) return false;

    hideLiveDropPreview(view);
    const change = drag.target?.change;
    if (!change) {
      endDrag(view);
      // a block from the page flies back home, where it's selected again
      if (drag.origin.kind === "page") settleBlock(view);
      return true;
    }

    // letting go right after the preview moved beats its check, and
    // the dropped block has no height until the next frame
    const wasPastPage = isPastPage(view);
    dropBlock(view, drag, change);
    requestAnimationFrame(() => {
      const isNewlyPastPage = !wasPastPage && isPastPage(view);
      if (isNewlyPastPage && !fitsWithoutEmptyLinesPastPage(view, false)) {
        takeBackDrop(drag.startState);
      }
    });
    return true;
  }

  // Whether a block from the page is dragged past the editor
  function isPageDragOutside(view: EditorView, event: DragEvent): boolean {
    const drag = blockDragPluginKey.getState(view.state);
    return (
      drag?.origin.kind === "page" &&
      !view.dom.contains(event.target as Node | null)
    );
  }

  return new Plugin<DragState>({
    key: blockDragPluginKey,

    view: (editorView) => {
      emptyPicture = new Image();
      emptyPicture.src = EMPTY_PICTURE;

      // Past the page, a block from the page acts like it's at the page's
      // nearest edge, so it never disappears, and letting go drops it there
      const onDragOver = (event: DragEvent) => {
        if (!isPageDragOutside(editorView, event)) return;
        event.preventDefault(); // lets it be dropped here
        aimAtCursor(editorView, event);
      };
      const onDrop = (event: DragEvent) => {
        if (!isPageDragOutside(editorView, event)) return;
        event.preventDefault();
        dropAtTarget(editorView);
      };
      // The browser sends a cancelled drag's end to the dragged block, which
      // the previews may have redrawn off the page, so the editor never hears
      // it. A move with the button up only comes once the drag is over, so
      // that ends it. A move while the drag is still starting keeps it
      const onMouseMove = (event: MouseEvent) => {
        const isButtonUp = event.buttons === 0;
        if (isButtonUp && blockDragPluginKey.getState(editorView.state)) {
          cancelDrag(editorView);
        }
      };
      document.addEventListener("dragover", onDragOver);
      document.addEventListener("drop", onDrop);
      document.addEventListener("mousemove", onMouseMove);
      return {
        destroy: () => {
          document.removeEventListener("dragover", onDragOver);
          document.removeEventListener("drop", onDrop);
          document.removeEventListener("mousemove", onMouseMove);
        },
      };
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
        const isGoingHome = target !== null && target.change === null;
        const isOriginalShown =
          isGoingHome || target?.change?.includesOriginal === true;
        const blockSize = drag.block.nodeSize;
        const decorations: Decoration[] = [];
        if (origin.kind === "page" && !isOriginalShown) {
          decorations.push(
            Decoration.node(origin.from, origin.from + blockSize, {
              class: "block-drag-source",
            }),
          );
          const $block = state.doc.resolve(origin.from);
          if (isLeftOnlyEmptyText($block.node(1), $block.index(1))) {
            const rowStart = $block.before(1);
            decorations.push(
              Decoration.node(rowStart, rowStart + $block.node(1).nodeSize, {
                class: "block-drag-source-row",
              }),
            );
          }
        }
        // going home, the original is the spot it lands on
        if (origin.kind === "page" && isGoingHome) {
          decorations.push(
            Decoration.node(origin.from, origin.from + blockSize, {
              class: "drop-spot",
            }),
          );
        }
        if (preview) {
          decorations.push(
            Decoration.node(
              preview.copyPos,
              preview.copyPos + blockSize,
              { class: "live-drop-preview drop-spot" },
              DROP_PREVIEW_SPEC,
            ),
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

            // the drag starts aimed at home, so the block never flashes away
            const origin: DragOrigin = {
              kind: "page",
              startFrom: selection.from,
              from: selection.from,
            };
            // copied while the block still shows on the page
            const blockDom = view.nodeDOM(selection.from);
            if (blockDom instanceof HTMLElement) {
              showDragGhost(view, blockDom, event.clientX, event.clientY);
            }
            setDragState(view, {
              startState: view.state,
              origin,
              block: selection.node,
              blockMinSize: readContentMinSize(view, selection.from),
              page: measurePage(view, origin, false),
              target: HOME_TARGET,
              preview: null,
            });
          });
          return false;
        },

        dragover: (view, event) => {
          aimAtCursor(view, event);
          return false;
        },

        // Moving between parts of the page also fires this, so the target
        // only clears once the cursor leaves the editor. A block from the
        // page keeps its target, since past the page it acts like it's at
        // the page's edge
        dragleave: (view, event) => {
          const drag = blockDragPluginKey.getState(view.state);
          const leftEditor = !view.dom.contains(
            event.relatedTarget as Node | null,
          );

          if (drag?.target && leftEditor && drag.origin.kind === "panel") {
            hideLiveDropPreview(view);
            const current = blockDragPluginKey.getState(view.state);
            if (current) setDragState(view, { ...current, target: null });
          }
          return false;
        },

        // A cancelled drag puts the page back as it was
        dragend: (view) => {
          // after a drop the drag is already over and the ghost is landing
          if (blockDragPluginKey.getState(view.state)) cancelDrag(view);
          return false;
        },
      },

      handleDrop: (view) => dropAtTarget(view),
    },
  });
}
