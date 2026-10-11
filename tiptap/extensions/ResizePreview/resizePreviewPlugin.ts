import type { Fragment } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { DOMSerializer } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import "./ResizePreview.css";

// While a resize is past the buffer: the text column it will remove, and
// where that text will go once the resize is let go
export type TextRemovalPreview = {
  from: number; // where the removed text column starts
  to: number; // where it ends
  moveTo: number; // where its text will go
  content: Fragment | null; // the text that moves, or null when it's empty
} | null;

const resizePreviewPluginKey = new PluginKey<TextRemovalPreview>(
  "resizePreview",
);

// Saves a new preview, or clears it with null, without adding a step to undo
export function setTextRemovalPreview(
  view: EditorView,
  preview: TextRemovalPreview,
) {
  view.dispatch(
    view.state.tr
      .setMeta(resizePreviewPluginKey, preview)
      .setMeta("addToHistory", false),
  );
}

// A faded copy of the text that will move, drawn where it will end up
function createGhost(view: EditorView, content: Fragment) {
  const ghost = document.createElement("div");
  ghost.className = "resize-text-ghost";
  ghost.appendChild(
    DOMSerializer.fromSchema(view.state.schema).serializeFragment(content),
  );
  return ghost;
}

// Fades the text a resize will remove and shows a ghost of it where it
// will go, so the result is clear before letting go
export function createResizePreviewPlugin(): Plugin {
  return new Plugin<TextRemovalPreview>({
    key: resizePreviewPluginKey,

    // The plugin's memory: the preview to show, or null
    state: {
      init: () => null,
      apply: (tr, preview) => {
        const meta = tr.getMeta(resizePreviewPluginKey) as
          TextRemovalPreview | undefined;
        if (meta !== undefined) return meta;
        if (!preview || !tr.docChanged) return preview;

        // the block's size changes while dragging, so positions follow along
        return {
          ...preview,
          from: tr.mapping.map(preview.from),
          to: tr.mapping.map(preview.to),
          moveTo: tr.mapping.map(preview.moveTo),
        };
      },
    },

    props: {
      decorations: (state) => {
        const preview = resizePreviewPluginKey.getState(state);
        if (!preview) return null;

        const { from, to, moveTo, content } = preview;
        const decorations = [
          Decoration.node(from, to, { class: "resize-text-removing" }),
        ];
        if (content) {
          decorations.push(
            Decoration.widget(moveTo, (view) => createGhost(view, content), {
              key: "resize-text-ghost",
            }),
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
