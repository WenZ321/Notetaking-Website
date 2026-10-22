import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type {
  CustomBlockNode,
  PageNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { MinBlockSize } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";
import type { MeasuredPage } from "./DragUtils";
import type { DropTarget } from "./PageChange";
import { PluginKey } from "@tiptap/pm/state";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// While a block is dragged. Every drop is worked out on the page from
// before the drag, since a preview changes the page under the cursor
export type DragState = {
  startState: EditorState; // the editor before the drag
  startFrom: number; // where the dragged block starts in it
  from: number; // where the dragged block is on the page now, moved by a preview
  block: CustomBlockNode;
  blockMinSize: MinBlockSize; // the smallest size its content allows
  grabOffsetX: number; // how far from its left edge it was grabbed
  page: MeasuredPage;
  target: DropTarget | null; // null when there's nowhere to drop
  preview: LiveDropPreview | null;
} | null;

// A drag in progress
export type ActiveDrag = NonNullable<DragState>;

// The drop shown on the page while dragging, and the undo history from
// before it, so taking it away leaves undo as if it never happened
export type LiveDropPreview = {
  copyPos: number; // where the shown block starts
  historyBeforePreview: unknown;
};

export const blockDragPluginKey = new PluginKey<DragState>("blockDragAndDrop");

// Put on the changes that show or take away a preview, so things like
// autosave can tell they aren't real edits
export const LIVE_DROP_PREVIEW_META = "liveDropPreview";

// Saves a new drag state, without adding a step to undo
export function setDragState(view: EditorView, drag: DragState) {
  dispatchChange(
    view,
    view.state.tr.setMeta(blockDragPluginKey, drag),
    "skipUndo",
  );
}

// Clears the drag, which shows the original again
export function endDrag(view: EditorView) {
  if (blockDragPluginKey.getState(view.state)) setDragState(view, null);
}

// The page as it should be saved. While a drop is previewed, that's the
// page from before the drag, since the preview isn't a real edit
export function getSavableDoc(state: EditorState): PageNode {
  const drag = blockDragPluginKey.getState(state);
  return drag?.preview ? drag.startState.doc : state.doc;
}
