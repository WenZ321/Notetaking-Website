import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { BLOCK_RESIZE_META, dispatchChange } from "@/tiptap/TransactionBehavior";

// A row whose block is being resized far enough to change its wrap, drawn
// the way letting go will leave it: a newspaper snapped to a page edge, or a
// floated block that opened text on its edge side and became a newspaper
export type SnapPreview =
  | { wrappedBlockPos: number; side: "left" | "right" }
  | { wrappedBlockPos: number; side: "newspaper"; leftTextWidth: number }
  | null;

const snapPreviewPluginKey = new PluginKey<SnapPreview>("snapPreview");

// Shows a row snapped to a new wrap while its block is resized, or stops
// showing it with null, without adding a step to undo
export function setSnapPreview(view: EditorView, snapPreview: SnapPreview) {
  dispatchChange(
    view,
    view.state.tr.setMeta(snapPreviewPluginKey, snapPreview),
    "skipUndo",
  );
}

// Marks the row shown snapped, so the CSS can draw it with its new wrap.
// A resize starting or ending clears it
export function createSnapPreviewPlugin(): Plugin {
  return new Plugin<SnapPreview>({
    key: snapPreviewPluginKey,

    state: {
      init: () => null,
      apply: (tr, shown) => {
        if (tr.getMeta(BLOCK_RESIZE_META)) return null;

        const snapPreview = tr.getMeta(snapPreviewPluginKey) as
          SnapPreview | undefined;
        if (snapPreview !== undefined) return snapPreview;

        return (
          shown && {
            ...shown,
            wrappedBlockPos: tr.mapping.map(shown.wrappedBlockPos),
          }
        );
      },
    },

    props: {
      decorations: (state) => {
        const snapPreview = snapPreviewPluginKey.getState(state);
        const row =
          snapPreview && state.doc.nodeAt(snapPreview.wrappedBlockPos);
        if (!snapPreview || !row) return null;

        // the left text's width reaches the CSS as a variable
        const { wrappedBlockPos, side } = snapPreview;
        const leftText =
          snapPreview.side === "newspaper"
            ? { style: `--snap-left-text: ${snapPreview.leftTextWidth}px` }
            : {};
        return DecorationSet.create(state.doc, [
          Decoration.node(wrappedBlockPos, wrappedBlockPos + row.nodeSize, {
            "data-snap": side,
            ...leftText,
          }),
        ]);
      },
    },
  });
}
